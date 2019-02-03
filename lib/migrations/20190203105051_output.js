exports.up = async function(knex) {
  await knex.schema.createTable("output", function(t) {
    t.increments("id")
      .unsigned()
      .primary();
    t.bigInteger("tx_id")
      .references("id")
      .inTable("tx");
    t.integer("index");
    t.bigInteger("value");
    t.string("address");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("output");
};
