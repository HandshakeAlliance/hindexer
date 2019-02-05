exports.up = async function(knex) {
  await knex.schema.createTable("tx", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.string("hash");
    t.string("txid");
    t.string("witnesshash");
    t.string("blockhash");
    t.bigInteger("size");
    t.bigInteger("value");
    t.bigInteger("minFee");
    t.bigInteger("locktime");
    t.bigInteger("fee");
    t.bigInteger("rate");
    //Do some research on what would be a faster index - block height or block hash for foreign keys.
    t.bigInteger("height");
    t.bigInteger("time");
    t.bigInteger("index");
    t.bigInteger("version");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("tx");
};
