exports.up = async function(knex) {
  await knex.schema.createTable("output", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.integer("tx_id")
      .references("id")
      .inTable("tx");

    t.bigInteger("index").notNull();

    t.bigInteger("value").notNull();

    t.string("address").notNull();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("output");
};
