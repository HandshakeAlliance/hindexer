exports.up = async function(knex) {
  await knex.schema.createTable("block", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.string("hash");
    //? Maybe not needed.
    //We can add this on response time.
    t.integer("strippedsize");
    t.integer("size");
    t.integer("height");
    t.integer("weight");
    t.integer("version");
    t.string("merkleroot");
    t.string("witnessroot");
    t.string("filterroot");
    t.string("reservedroot");
    t.string("nonce");
    t.bigInteger("time");
    t.bigInteger("bits");
    t.string("chainwork");
    t.string("previousblockhash");
    t.string("nextblockhash");
    t.string("mined_by");
    t.bigInteger("total_txs");
    t.bigInteger("fees");
    t.bigInteger("reward");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("block");
};
