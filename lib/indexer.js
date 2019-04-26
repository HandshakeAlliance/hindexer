const EventEmitter = require("events");
const { Lock } = require("bmutex");
const { Network, Block, TX } = require("hsd");
const records = require("./records");
const Logger = require("blgr");
const assert = require("bsert");
const path = require("path");

const Knex = require("knex");
const { Model } = require("objection");

const { BlockMeta, ChainState } = records;

const Blocki = require("./models/block.js");
const TXi = require("./models/tx.js");

class Indexer extends EventEmitter {
  constructor(options) {
    super();

    this.options = new IndexerOptions(options);

    //db config
    this.dbClient = this.options.dbClient;
    this.dbHost = this.options.dbHost;
    this.dbPort = this.options.dbPort;
    this.dbUser = this.options.dbUser;
    this.dbPass = this.options.dbPass;
    this.dbName = this.options.dbName;

    this.network = this.options.network;
    this.logger = this.options.logger.context("hindexer");
    this.client = this.options.client || new NullClient(this);

    this.state = new ChainState();
    this.height = -1;

    this.tip = new BlockMeta();
    this.lock = new Lock();

    this.node = this.options.node;

    this.init();
  }

  /**
   * Initialize nomenclatedb.
   * @private
   */

  init() {
    this._bind();
  }

  async initDB() {
    const knex = Knex({
      client: this.dbClient,
      connection: {
        host: this.dbHost,
        user: this.dbUser,
        password: this.dbPass,
        database: this.dbName,
        timezone: "UTC"
      },
      migrations: {
        tableName: "knex_migrations",
        directory: __dirname + "/migrations"
      }
    });

    //Run the migrations
    try {
      await knex.migrate.latest();
      console.log("Migrations completed!");
    } catch (err) {
      console.log("The Migrations failed with the following error:");
      console.log(err);
      process.exit(1);
    }

    //When the seeds work well, do this. XXX
    // await knex.seed.run();

    //Bind the models to Knex.
    Model.knex(knex);

    //Check the connection status
    try {
      await knex.raw("select 1+1 as result");
    } catch (err) {
      //We can decide on how to handle this if we want to do it a different way XXX
      console.log("Cannot connected to the database...");
      console.log("Closing now.");
      process.exit(1);
    }
  }

  _bind() {
    /**
     * Bind to node events.
     * @private
     */

    this.client.on("error", err => {
      this.emit("error", err);
    });

    this.client.on("connect", async () => {
      try {
        await this.syncNode();
      } catch (e) {
        this.emit("error", e);
      }
    });

    this.client.bind("block connect", async (entry, block, view) => {
      try {
        await this.addBlock(entry, block, view);
      } catch (e) {
        this.emit("error", e);
      }
    });

    //TODO
    // this.client.bind("block disconnect", async (entry, block, view) => {
    //   try {
    //     await this.unindexBlock(entry, block, view);
    //   } catch (e) {
    //     this.emit("error", e);
    //   }
    // });

    // this.client.bind("chain reset", async tip => {
    //   try {
    //     await this.rollback(tip.height);
    //   } catch (e) {
    //     this.emit("error", e);
    //   }
    // });
  }

  async open() {
    await this.initDB();
    // await this.db.open();

    // await this.db.verify(layout.V.encode(), "nomenclate", 0);

    // await this.verifyNetwork();

    //Get tip of chain when starting
    let tip = await this.client.getTip();

    //Get the last sync height
    // let height = await this.db.get(layout.H.encode());
    let block = await Blocki.getLatest();

    this.height = block ? block.height : -1;

    this.logger.info(
      "hindex initialized at height: %d, and chain tip: %d",
      this.height + 1,
      tip.height
    );

    //Open the connect to daemon
    await this.connect();
  }

  /**
   * Connect to the node server (client required).
   * @returns {Promise}
   */

  async connect() {
    return this.client.open();
  }

  async syncNode() {
    const unlock = await this.lock.lock();
    let start = process.hrtime();
    try {
      this.logger.info("Resyncing from server...");
      await this.syncChain();
    } finally {
      let end = process.hrtime(start);
      this.logger.info("hindex fully synced with server in %d seconds", end[0]);
      unlock();
    }
  }

  /**
   * Connect and sync with the chain server.
   * @private
   * @returns {Promise}
   */

  async syncChain() {
    return this.scan();
  }

  /**
   * Rescan blockchain from a given height.
   * @private
   * @param {Number?} height
   * @returns {Promise}
   */

  async scan(height) {
    if (height == null) height = this.height + 1;

    assert(height >>> 0 === height, "hindex: Must pass in a height.");

    const tip = await this.client.getTip();

    if (tip.height < height) {
      height = tip.height;
    }

    //This needs to be under a condition I think.
    //XXX
    // await this.rollback(height);

    this.logger.info("hindex is scanning %d blocks.", tip.height - height + 1);

    try {
      this.rescanning = true;

      for (let i = height; i <= tip.height; i++) {
        const entry = await this.client.getEntry(i);
        assert(entry);

        const block = await this.client.getBlock(entry.hash);
        assert(block);

        const view = await this.client.getBlockView(block);
        assert(view);

        await this._addBlock(entry, block, view);
      }
    } catch (e) {
      console.log(e);
    } finally {
      this.rescanning = false;
    }
  }

  /**
   * Add a block's transactions and write the new best hash.
   * @param {ChainEntry} entry
   * @returns {Promise}
   */

  async addBlock(entry, block, view) {
    const unlock = await this.lock.lock();
    try {
      this.logger.info("Adding block: %d.", entry.height);
      return await this._addBlock(entry, block, view);
    } finally {
      unlock();
    }
  }

  async _addBlock(entry, block, view) {
    const blockmeta = BlockMeta.fromEntry(entry);
    // const dbBlock = await Blocki.fromEntry(entry);

    let options = entry;

    let newtxs = [];

    let newtxs2 = [];

    let i = 0;
    for (let tx of block.txs) {

      const meta = await this.node.getMeta(tx.hash());
      const view = await this.node.getMetaView(meta);

      const tx2 = meta.getJSON(this.network.type, view, this.node.chain.height);

      //TODO I think this can be deleted.
      let newtx = new TX(tx);

      let newtx2 = await TXi.format(newtx, tx2, entry, block, view, i);

      newtxs.push(newtx);

      newtxs2.push(newtx2);
      i++;
    }

    options.txs = newtxs;

    let block2;

    try {
      block2 = new Block(options);
    } catch (e) {
      console.log(e);
    }

    block2.chainwork = entry.chainwork;

    const dbBlock = await Blocki.fromEntry(block2, entry.height, newtxs2);

    if (block.height < this.height) {
      this.logger.warning(
        "hindex is connecting low blocks (%d).",
        block.height
      );
      return 0;
    }

    if (block.height >= this.network.block.slowHeight)
      // this.logger.debug("Adding block: %d.", block.height);

      // Sync the state to the new tip.
      this.height = block.height;

    return 0;
  }

  async _addTX(tx, block) {
    assert(!tx.mutable, "HDB: Cannot add mutable TX.");

    // if (block && !this.state.marked) await this.markState(block);

    let result = false;

    const b = this.db.batch();

    let txid = Buffer.from(tx.txid(), "hex");

    //Do inputs first
    for (let input of tx.inputs) {
      if (input.isCoinbase()) {
        continue;
      }

      let previousHashPrefix = Buffer.from(input.prevout.txid(), "hex").slice(
        0,
        8
      );
      let previousIndex = input.prevout.index;

      b.put(layout.i.encode(previousHashPrefix, previousIndex), txid);
    }

    //Outputs
    for (let output of tx.outputs) {
      let address = Buffer.from(output.address.getHash(), "hex");

      if (output.covenant.isName()) {
        b.put(
          layout.n.encode(output.covenant.getHash(0), txid),
          fromU32(block.height)
        );
      }

      b.put(layout.o.encode(address, txid), fromU32(block.height));
    }

    b.put(layout.t.encode(txid), fromU32(block.height));

    await b.write();

    //Parse the outputs and connect insert them.

    //The goal here is to just start with UTXOs

    // Insert the transaction
    // into every matching wallet.
    // for (const wid of wids) {
    //   const wallet = await this.get(wid);

    //   assert(wallet);

    // if (await wallet.add(tx, block)) {
    //   this.logger.info(
    //     "Added transaction to wallet in WalletDB: %s (%d).",
    //     wallet.id,
    //     wid
    //   );
    //   result = true;
    // }
    // }

    if (!result) return null;

    return wids;
  }
}

class IndexerOptions {
  /**
   * Create nomenclate options.
   * @constructor
   * @param {Object} options
   */

  constructor(options) {
    this.network = Network.primary;
    this.logger = Logger.global;
    this.chain = null;
    this.client = null;
    this.prefix = null;
    this.location = null;
    this.memory = true;
    this.maxFiles = 64;
    this.cacheSize = 16 << 20;
    this.compression = true;
    this.node = null;

    //DB options XXX - Default these to levelDB.
    this.dbHost = null;
    this.dbPort = null;
    this.dbClient = null;
    this.dbUsername = null;
    this.dbPassword = null;

    if (options) this._fromOptions(options);
  }

  /**
   * Inject properties from object.
   * @private
   * @param {Object} options
   * @returns {NomenclateDBOptions}
   */

  _fromOptions(options) {
    if (options.network != null) this.network = Network.get(options.network);

    if (options.logger != null) {
      assert(typeof options.logger === "object");
      this.logger = options.logger;
    }

    if (options.node != null) {
      assert(typeof options.node === "object");
      this.node = options.node;
    }

    if (options.client != null) {
      assert(typeof options.client === "object");
      this.client = options.client;
    }

    if (options.chain != null) {
      assert(typeof options.chain === "object");
      this.client = new ChainClient(options.chain);
    }

    assert(this.client);

    if (options.prefix != null) {
      assert(typeof options.prefix === "string");
      this.prefix = options.prefix;
      this.location = path.join(this.prefix, "nomenclate");
    }

    if (options.location != null) {
      assert(typeof options.location === "string");
      this.location = options.location;
    }

    if (options.memory != null) {
      assert(typeof options.memory === "boolean");
      this.memory = options.memory;
    }

    if (options.maxFiles != null) {
      assert(options.maxFiles >>> 0 === options.maxFiles);
      this.maxFiles = options.maxFiles;
    }

    if (options.cacheSize != null) {
      assert(Number.isSafeInteger(options.cacheSize) && options.cacheSize >= 0);
      this.cacheSize = options.cacheSize;
    }

    if (options.dbHost != null) {
      assert(typeof options.dbHost === "string");
      this.dbHost = options.dbHost;
    }

    if (options.dbPort != null) {
      assert(typeof options.dbPort === "string");
      this.dbPort = options.dbPort;
    }

    if (options.dbClient != null) {
      assert(typeof options.dbClient === "string");
      //Probably do checks in here for pg, mysql, and throw error on unsupported client. XXX
      this.dbClient = options.dbClient;
    }

    if (options.dbUser != null) {
      assert(typeof options.dbUser === "string");
      this.dbUser = options.dbUser;
    }

    if (options.dbPass != null) {
      assert(typeof options.dbPass === "string");
      this.dbPass = options.dbPass;
    }

    if (options.dbName != null) {
      assert(typeof options.dbName === "string");
      this.dbName = options.dbName;
    }

    return this;
  }

  /**
   * Instantiate chain options from object.
   * @param {Object} options
   * @returns {NomenclateDBOptions}
   */

  static fromOptions(options) {
    return new this()._fromOptions(options);
  }
}

module.exports = Indexer;
