const { Model } = require("objection");

class Block extends Model {
  static get tableName() {
    return "block";
  }

  static get relationMappings() {
    const TX = require("./tx.js");

    return {
      tx: {
        relation: Model.HasManyRelation,
        modelClass: TX,
        join: {
          from: "block.id",
          to: "tx.block_id"
        }
      }
    };
  }

  //Returns the latest block in the block by height.
  static async getLatest() {
    let block = await Block.query()
      .orderBy("height", "desc")
      .first();

    return block;
  }

  static async setNextHash(entry, height) {
    return await Block.query()
      .patch({ nextblockhash: entry.hash().toString("hex") })
      .where("height", height - 1);
  }

  static async fromEntry(entry, height, txs) {
    if (height != 0) {
      await Block.setNextHash(entry, height);
    }
    let block = {
      hash: entry.hash().toString("hex"),
      height: height,
      size: entry.getSize(),
      strippedsize: entry.getBaseSize(),
      weight: entry.getWeight(),
      version: entry.version,
      merkleroot: entry.merkleRoot.toString("hex"),
      witnessroot: entry.witnessRoot.toString("hex"),
      filterroot: entry.filterRoot.toString("hex"),
      reservedroot: entry.reservedRoot.toString("hex"),
      nonce: entry.nonce.toString("hex"),
      previousblockhash: entry.prevBlock.toString("hex"),
      chainwork: entry.chainwork.toString("hex", 64),
      difficulty: toDifficulty(entry.bits),
      bits: entry.bits,
      time: entry.time,
      tx: txs,
      mined_by: txs[0].outputs[0].address,
      total_txs: txs.length,
      fees: await getBlockFees(txs[0], height),
      reward: await getBlockReward(height)
    };

    let result = await Block.query().insertGraph(block);

    return result;
  }
}

function toDifficulty(bits) {
  let shift = (bits >>> 24) & 0xff;
  let diff = 0x0000ffff / (bits & 0x00ffffff);

  while (shift < 29) {
    diff *= 256.0;
    shift++;
  }

  while (shift > 29) {
    diff /= 256.0;
    shift--;
  }

  return diff;
}

async function getBlockReward(height) {
  //Block Reward starts at 1000, and halves every 340000 blocks

  //XXX Double check math on this
  //Block halvening is 5000 blocks on Regtest
  let exponent = Math.floor(height / 340000);

  let blockReward = 1000 / Math.pow(2, exponent);

  //Need to convert back to HNS
  return blockReward * 1000000;
}

async function getBlockFees(coinbaseTx, blockHeight) {
  if (coinbaseTx == null) {
    return 0;
  }

  var blockReward = await getBlockReward(blockHeight);

  let totalOutput = 0;

  for (let output of coinbaseTx.outputs) {
    totalOutput += output.value;
  }

  let totalFees = totalOutput - blockReward;
  return totalFees;
}

module.exports = Block;
