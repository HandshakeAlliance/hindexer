const { Model } = require("objection");

const Output = require("./output.js");
const Input = require("./input.js");

class TX extends Model {
  static get tableName() {
    return "tx";
  }

  static get relationMappings() {
    const Block = require("./block.js");

    return {
      block: {
        relation: Model.BelongsToOneRelation,
        modelClass: Block,
        join: {
          from: "tx.blockhash",
          to: "block.hash"
        }
      },

      outputs: {
        relation: Model.HasManyRelation,
        modelClass: Output,
        join: {
          from: "tx.id",
          to: "output.tx_id"
        }
      },

      inputs: {
        relation: Model.HasManyRelation,
        modelClass: Input,
        join: {
          from: "tx.id",
          to: "input.tx_id"
        }
      }
    };
  }

  static async format(tx, entry, block, view, index) {
    let newtx = {
      hash: tx.txid(),
      txid: tx.txid(),
      witnesshash: tx.wtxid(),
      blockhash: entry.hash.toString("hex"),
      size: tx.getSize(),
      value: tx.getOutputValue(),
      minFee: tx.getMinFee(),
      locktime: tx.locktime,
      fee: tx.getFee(view),
      rate: tx.getRate(view),
      height: entry.height,
      time: block.time,
      index: index,
      version: tx.version
    };

    newtx.outputs = await Output.parse(tx.outputs);
    newtx.inputs = await Input.parse(tx.inputs);

    return newtx;
  }
}

module.exports = TX;
