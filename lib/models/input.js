const { Model } = require("objection");

const { Network } = require("hsd");

//Has to be dynamic based on the network XXX.
const network = Network.get("testnet");

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

  static async parse(inputs, hashfunc) {
    let newInputs = [];

    let i = 0;
    for (let inp of inputs) {
      let newI = await Input.format(inp, i, hashfunc);
      newInputs.push(newI);
      i++;
    }

    return newInputs;
  }

  static async getPrevoutID(prevout_hash, hashfunc) {
    const ZERO_HASH =
      "0000000000000000000000000000000000000000000000000000000000000000";

    if (prevout_hash != ZERO_HASH) {
      let id = await hashfunc(prevout_hash);

      return id;
    }

    return null;
  }

  static async format(input, index, hashfunc) {
    let address = input.getAddress();

    if (address) {
      address = address.toString(network);
    }

    let prevout_txid = await Input.getPrevoutID(input.prevout.txid(), hashfunc);

    let newInput = {
      index: index,
      address: address,
      prevout_hash: input.prevout.txid(),
      prevout_index: input.prevout.index,
      prevout_tx_id: prevout_txid,
      witness: input.witness.toString(),
      sequence: input.sequence
    };

    return newInput;
  }
}

module.exports = Input;
