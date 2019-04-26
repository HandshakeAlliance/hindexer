/*!
 * util.js - utils for nomenclate
 * Copyright (c) 2017-2018, Christopher Jeffrey (MIT License).
 * Copyright (c) 2018, Handshake Alliance Developers (MIT License).
 * https://github.com/handshakealliance/nomenclate
 */

/**
 * @exports util
 */

const util = exports;

util.now = function now() {
  return Math.floor(Date.now() / 1000);
};

util.blockReward = function blockReward(height) {
  //TODO make this all come from network constants
  let exponent = Math.floor(height / 340000);

  let blockReward = 2000 / Math.pow(2, exponent);

  //Need to convert back to HNS
  return blockReward * 1000000;
}
