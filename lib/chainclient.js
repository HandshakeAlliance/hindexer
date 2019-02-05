/*
 * chainclient.js - chain client for hindex
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * Copyright (c) 2018-2019, Handshake Alliance Developers (MIT License).
 * https://github.com/handshakealliance/hindex
 */

"use strict";

const assert = require("bsert");
const AsyncEmitter = require("bevent");
const CoinView = require("hsd").coins.CoinView;

/**
 * Node Client
 * @alias module:hindex.ChainClient
 */

class ChainClient extends AsyncEmitter {
  /**
   * Create a chain client.
   * @constructor
   */

  constructor(chain) {
    super();

    this.chain = chain;
    this.network = chain.network;
    this.opened = false;

    this.init();
  }

  /**
   * Initialize the client.
   */

  init() {
    this.chain.on("connect", (entry, block, view) => {
      if (!this.opened) return;

      this.emit("block connect", entry, block, view);
    });

    this.chain.on("disconnect", (entry, block, view) => {
      if (!this.opened) return;

      this.emit("block disconnect", entry, block, view);
    });

    this.chain.on("reset", tip => {
      if (!this.opened) return;

      this.emit("chain reset", tip);
    });
  }

  /**
   * Open the client.
   * @returns {Promise}
   */

  async open(options) {
    assert(!this.opened, "ChainClient is already open.");
    this.opened = true;
    setImmediate(() => this.emit("connect"));
  }

  /**
   * Close the client.
   * @returns {Promise}
   */

  async close() {
    assert(this.opened, "ChainClient is not open.");
    this.opened = false;
    setImmediate(() => this.emit("disconnect"));
  }

  /**
   * Add a listener.
   * @param {String} type
   * @param {Function} handler
   */

  bind(type, handler) {
    return this.on(type, handler);
  }

  /**
   * Add a listener.
   * @param {String} type
   * @param {Function} handler
   */

  hook(type, handler) {
    return this.on(type, handler);
  }

  /**
   * Get chain tip.
   * @returns {Promise}
   */

  async getTip() {
    return this.chain.tip;
  }

  /**
   * Rescan for any missed transactions.
   * @param {Number|Hash} start - Start block.
   * @param {Bloom} filter
   * @param {Function} iter - Iterator.
   * @returns {Promise}
   */

  async rescan(start) {
    return this.chain.scan(start, this.filter, (entry, txs) => {
      return this.emitAsync("block rescan", entry, txs);
    });
  }

  /**
   * Get chain entry.
   * @param {Hash/Number} hash
   * @returns {Promise}
   */

  async getEntry(hash) {
    const entry = await this.chain.getEntry(hash);

    if (!entry) return null;

    if (!(await this.chain.isMainChain(entry))) return null;

    return entry;
  }

  /**
   * Get block
   * @param {Hash} hash
   * @returns {Promise}
   */

  async getBlock(hash) {
    const block = await this.chain.getBlock(hash);

    if (!block) return null;

    return block;
  }

  /**
   * Get tx
   * @param {Hash} hash
   * @returns {Promise}
   */

  async getTX(hash) {
    const tx = await this.chain.getTX(hash);

    if (!tx) return null;

    return tx;
  }

  /**
   * Spend and update inputs.
   * @private
   * @param {Block} block
   * @param {ChainEntry} prev
   * @returns {Promise} - Returns {@link CoinView}.
   */

  async updateInputs(block, prev) {
    const view = new CoinView();
    const height = prev ? prev.height + 1 : 0;
    console.log(height);
    const cb = block.txs[0];

    view.addTX(cb, height);

    for (let i = 1; i < block.txs.length; i++) {
      const tx = block.txs[i];

      //Check for double spends
      // assert(
      //   await view.spendInputs(this.db, tx),
      //   "BUG: Spent inputs in historical data!"
      // );

      view.addTX(tx, height);
    }

    return view;
  }

  /**
   * Get previous entry.
   * @param {ChainEntry} entry
   * @returns {Promise} - Returns ChainEntry.
   */

  getPrevious(entry) {
    return this.chain.getEntryByHash(entry.prevBlock);
  }

  /**
   * Get a historical block coin viewpoint.
   * @param {Block} hash
   * @returns {Promise} - Returns {@link CoinView}.
   */

  async getBlockView(block) {
    // const prev = await this.getPrevious(block);
    const prev = await this.chain.getPrevious(block);
    const view = await this.updateInputs(block, prev);
    return view;
  }
}

/*
 * Expose
 */

module.exports = ChainClient;
