const { Model } = require("objection");
const Resource = require("hsd/lib/dns/resource.js");

const Covenant = require("hsd/lib/primitives/covenant.js");

class MCovenant extends Model {
  static get tableName() {
    return "covenant";
  }

  static get relationMappings() {
    const Output = require("./output.js");

    return {
      output: {
        relation: Model.BelongsToOneRelation,
        modelClass: Output,
        join: {
          from: "covenant.output_id",
          to: "output.id"
        }
      }
    };
  }

  static async format(covenant) {

    covenant = Covenant.fromJSON(covenant);

    if (covenant.isNone()) {
      return {
        action: "NONE"
      };
    }

    //Need test
    // if covenant.isClaim() {

    // }

    if (covenant.isOpen()) {
      return {
        action: "OPEN",
        name_hash: covenant.getHash(0).toString("hex")
      };
    }

    if (covenant.isBid()) {
      return {
        action: "BID",
        name_hash: covenant.getHash(0).toString("hex")
      };
    }

    if (covenant.isReveal()) {
      return {
        action: "REVEAL",
        name_hash: covenant.getHash(0).toString("hex"),
        nonce: covenant.getHash(2).toString("hex")
      };
    }

    if (covenant.isRedeem()) {
      return {
        action: "REDEEM",
        name_hash: covenant.getHash(0).toString("hex")
      };
    }

    if (covenant.isRegister()) {
      let res = Resource.decode(covenant.items[2]);
      return {
        action: "REGISTER",
        name_hash: covenant.getHash(0).toString("hex"),
        data: res.toHex()
      };
    }

    if (covenant.isUpdate()) {
      let res = Resource.decode(covenant.items[2]);
      return {
        action: "UPDATE",
        name_hash: covenant.getHash(0).toString("hex"),
        data: res.toHex()
      };
    }

    if (covenant.isRenew()) {
      return {
        action: "RENEW",
        name_hash: covenant.getHash(0).toString("hex")
      };
    }
    //TODO finish covenant types
  }
}

module.exports = MCovenant;
