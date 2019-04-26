const { Model } = require("objection");

const { Network, CoinView } = require("hsd");
const util = require("../util.js");


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

  static async parse(inputs, hashfunc, txHeight) {
    let newInputs = [];

    let i = 0;
    for (let inp of inputs) {
      let newI = await Input.format(inp, i, hashfunc, txHeight);
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

  static async format(input, index, hashfunc, txHeight) {
    // CoinView.h
    // let view = new CoinView();

    // let coin;

    // try {
    // coin = view.getEntryFor(input);
    // } catch (e) {
    //   console.log(e);
    // }
    // if (coin) {
    //   console.log(coin);
    // }

    // let address = input.getAddress();
    let value;
    let address;

    // if (address) {
    //   address = address.toString(network);
    // }

    // console.log(input);

    let prevout_txid = await Input.getPrevoutID(input.prevout.hash, hashfunc);

    if (!input.coin) {
      value = util.blockReward(txHeight);
      address = null;
    } else {
      value = input.coin.value;
      address = input.coin.address;
    }


    let newInput = {
      index: index,
      address: address,
      value: value,
      prevout_hash: input.prevout.hash,
      prevout_index: input.prevout.index,
      prevout_tx_id: prevout_txid,
      witness: input.witness,
      sequence: input.sequence
    };

    return newInput;
  }
}

module.exports = Input;
