const { Model } = require("objection");

class Input extends Model {
  static get tableName() {
    return "input";
  }

  static get relationMappings() {
    const TX = require("./tx.js");

    return {
      tx: {
        relation: Model.BelongsToOneRelation,
        modelClass: TX,
        join: {
          from: "input.tx_id",
          to: "tx.id"
        }
      }
    };
  }

  static async parse(inputs) {
    let newInputs = [];

    let i = 0;
    for (let inp of inputs) {
      let newI = await Input.format(inp, i);
      newInputs.push(newI);
      i++;
    }

    return newInputs;
  }

  static async format(input, index) {
    let address;

    if (!input.address) {
      address = null;
    } else {
      console.log(input.address.getHash());
      address = input.address.getHash();
    }

    let newInput = {
      index: index,
      address: address,
      prevout_hash: input.prevout.txid(),
      prevout_index: input.prevout.index,
      witness: input.witness.toString(),
      sequence: input.sequence
    };

    return newInput;
  }
}

module.exports = Input;
