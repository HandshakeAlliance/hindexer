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

    this.config = node.config.filter("hindex");
    this.config.open("hindex.conf");

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
      cacheSize: this.config.mb("cache-size")
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

plugin.id = "hindex";

/**
 * Plugin initialization.
 * @param {Node} node
 * @returns {Hindex-pg}
 */

plugin.init = function init(node) {
  return new Plugin(node);
};
