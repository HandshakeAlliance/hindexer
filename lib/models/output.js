const { Model } = require("objection");

const { Network } = require("hsd");

const network = Network.get("testnet");

class Output extends Model {
  static get tableName() {
    return "output";
  }

  static get relationMappings() {
    const TX = require("./tx.js");

    return {
      tx: {
        relation: Model.BelongsToOneRelation,
        modelClass: TX,
        join: {
          from: "output.tx_id",
          to: "tx.id"
        }
      }
    };
  }

  static async parse(outputs) {
    let newOutputs = [];

    let i = 0;
    for (let o of outputs) {
      let newO = await Output.format(o, i);
      newOutputs.push(newO);
      i++;
    }

    return newOutputs;
  }

  static async format(output, index) {
    let newOutput = {
      index: index,
      value: output.value,
      address: output.address.toString(network)
    };

    return newOutput;
  }
}

module.exports = Output;
