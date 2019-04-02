exports.up = async function(knex) {
  await knex.schema.createTable("input", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.integer("tx_id")
      .references("id")
      .inTable("tx");

    t.bigInteger("index").notNull();

    //If this is a coinbase input, then there won't be an address or a prevout_index.
    //Couple of thoughts. 1. We don't even store coinbase inputs, as they can be implied implicitly.
    //Or we losely define an input, and just link it to the tx. XXX
    t.string("address");

    t.bigInteger("prevout_index");

    t.string("prevout_hash");

    t.integer("prevout_tx_id");

    t.text("witness").notNull();

    t.bigInteger("sequence").notNull();

  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("input");
};
