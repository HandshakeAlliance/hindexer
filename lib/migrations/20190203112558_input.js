exports.up = async function(knex) {
  await knex.schema.createTable("input", function(t) {
    t.increments("id")
      .unsigned()
      .primary();
    t.integer("tx_id")
      .references("id")
      .inTable("tx");
    t.bigInteger("index");
    t.string("address");
    t.string("prevout_hash");
    t.bigInteger("prevout_index");
    t.text("witness");
    t.bigInteger("sequence");
    t.integer("prevout_tx_id");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("input");
};
