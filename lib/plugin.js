/*!
 * plugin.js - hindex plugin for HSD
 * Copyright (c) 2018-2019, Handshake Alliance Developers (MIT License).
 * https://github.com/handshakealliance/hindex
 */

"use strict";

const EventEmitter = require("events");
const { Network } = require("hsd");
const Indexer = require("./indexer.js");
const ChainClient = require("./chainclient");

/**
 * @exports hindex/plugin
 */

const plugin = exports;

/**
 * Plugin
 * @extends EventEmitter
 */

class Plugin extends EventEmitter {
  constructor(node) {
    super();

    //This is not working right now for some reason
    this.config = node.config.filter("hindexer");
    this.config.open("hindexer.conf");

    this.network = this.config.network;
    this.logger = node.logger;

    this.client = new ChainClient(node.chain);

    console.log("connecting to: %s", node.network);

    //Init DB here
    this.indexer = new Indexer({
      network: this.network,
      logger: this.logger,
      client: this.client,
      node: node,
      memory: this.config.bool("memory", node.memory),
      prefix: this.config.prefix,
      maxFiles: this.config.uint("max-files"),
      cacheSize: this.config.mb("cache-size"),
      dbClient: this.config.str("db-client"),
      dbHost: this.config.str("db-host"),
      dbPort: this.config.str("db-port"),
      dbUser: this.config.str("db-user"),
      dbPass: this.config.str("db-pass"),
      //Default to db name of hindex
      dbName: this.config.str("db-name", "hindex")
    });

    this.init();
  }

  init() {
    this.indexer.on("error", err => this.emit("error", err));
  }

  //Open the indexer
  async open() {
    await this.indexer.open();
  }

  //Close the indexer.
  async close() {}
}

/**
 * Plugin name.
 * @const {String}
 */

plugin.id = "hindexer";

/**
 * Plugin initialization.
 * @param {Node} node
 * @returns {Hindexer}
 */

plugin.init = function init(node) {
  return new Plugin(node);
};
