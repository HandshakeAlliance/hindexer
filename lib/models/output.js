const { Model } = require("objection");

const { Network } = require("hsd");

//Get this variable passed in from the config XXX
const network = Network.get("testnet");

const Covenant = require("./covenant.js");

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
      },
      covenant: {
        relation: Model.HasOneRelation,
        modelClass: Covenant,
        join: {
          from: "output.id",
          to: "covenant.output_id"
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
    let covenant = await Covenant.format(output.covenant);

    console.log(covenant);

    let newOutput = {
      index: index,
      value: output.value,
      address: output.address.toString(network),
      covenant: covenant
    };

    return newOutput;
  }
}

module.exports = Output;
