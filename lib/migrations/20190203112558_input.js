exports.up = async function(knex) {
  await knex.schema.createTable("input", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.integer("tx_id")
      .references("id")
      .inTable("tx");

    t.bigInteger("index").notNull();

    t.string("address").notNull();

    t.string("prevout_hash").notNull();

    t.bigInteger("prevout_index").notNull();

    t.text("witness").notNull();

    t.bigInteger("sequence").notNull();

    t.integer("prevout_tx_id").notNull();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("input");
};
