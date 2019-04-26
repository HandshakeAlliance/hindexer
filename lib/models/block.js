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
      .patch({ next_blockhash: entry.hash().toString("hex") })
      .where("height", height - 1);
  }

  static async fromEntry(entry, height, txs) {
    if (height != 0) {
      await Block.setNextHash(entry, height);
    }
    let block = {
      hash: entry.hash().toString("hex"),
      height: height,
      prev_hash: entry.prevBlock.toString("hex"),
      merkle_root: entry.merkleRoot.toString("hex"),
      time: entry.time,
      stripped_size: entry.getBaseSize(),
      size: entry.getSize(),
      weight: entry.getWeight(),
      version: entry.version,
      witness_root: entry.witnessRoot.toString("hex"),
      tree_root: entry.treeRoot.toString("hex"),
      filter_root: entry.filterRoot.toString("hex"),
      reserved_root: entry.reservedRoot.toString("hex"),
      nonce: entry.nonce.toString("hex"),
      bits: entry.bits,
      chainwork: entry.chainwork.toString("hex", 64),
      mined_by: txs[0].outputs[0].address,
      total_txs: txs.length,
      fees: await getBlockFees(txs[0], height),
      difficulty: toDifficulty(entry.bits),
      reward: await getBlockReward(height),
      tx: txs
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

//TODO deprecate this in favor of util
async function getBlockReward(height) {
  //Block Reward starts at 1000, and halves every 340000 blocks

  //XXX Double check math on this
  //Block halvening is 5000 blocks on Regtest
  let exponent = Math.floor(height / 340000);

  let blockReward = 2000 / Math.pow(2, exponent);

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
