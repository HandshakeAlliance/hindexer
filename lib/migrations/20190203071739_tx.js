exports.up = async function(knex) {
  await knex.schema.createTable("tx", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.integer("block_id")
      .references("id")
      .inTable("block");

    t.string("hash").notNull();

    t.string("txid").notNull();

    t.string("witness_hash").notNull();

    t.bigInteger("size").notNull();

    t.bigInteger("value").notNull();

    t.bigInteger("minFee").notNull();

    t.bigInteger("locktime").notNull();

    t.bigInteger("fee").notNull();

    t.bigInteger("rate").notNull();

    //Do some research on what would be a faster index - block height or block hash for foreign keys.
    t.bigInteger("height").notNull();

    t.bigInteger("time").notNull();

    t.bigInteger("index").notNull();

    t.bigInteger("version").notNull();

    //Indexes
    t.unique("txid");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("tx");
};
