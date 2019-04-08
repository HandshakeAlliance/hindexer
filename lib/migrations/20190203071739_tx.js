exports.up = async function(knex) {
  await knex.schema.createTable("tx", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.integer("block_id")
      .references("id")
      .inTable("block")
      .notNull();

    t.text("hash").notNull();

    t.text("tx_id").notNull();

    t.text("witness_hash").notNull();

    t.bigInteger("size").notNull();

    t.bigInteger("value").notNull();

    t.bigInteger("min_fee").notNull();

    t.bigInteger("locktime").notNull();

    t.bigInteger("fee").notNull();

    t.bigInteger("rate").notNull();

    //Do some research on what would be a faster index - block height or block hash for foreign keys.
    t.integer("height").notNull();

    t.bigInteger("time").notNull();

    t.bigInteger("index").notNull();

    t.integer("version").notNull();

    //Indexes
    t.unique("tx_id");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("tx");
};
