exports.up = async function(knex) {
  await knex.schema.createTable("input", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.integer("tx_id")
      .references("id")
      .inTable("tx")
      .notNull();

    t.bigInteger("index").notNull();

    //If this is a coinbase input, then there won't be an address or a prevout_index.
    //Couple of thoughts. 1. We don't even store coinbase inputs, as they can be implied implicitly.
    //Or we losely define an input, and just link it to the tx. XXX
    t.text("address");

    //I'm also not so sure that we need these in here XXX
    t.bigInteger("prevout_index");

    //See above
    t.text("prevout_hash");

    //See above
    t.integer("prevout_tx_id");

    t.bigInteger("value").notNull();

    t.text("witness").notNull();

    t.bigInteger("sequence").notNull();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("input");
};
