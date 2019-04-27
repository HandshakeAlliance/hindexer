exports.up = async function(knex) {
  await knex.schema.createTable("covenant", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    t.integer("type").notNull();
    t.text("action").notNull();
    t.specificType("items", "text[]");

    t.integer("output_id")
      .references("id")
      .inTable("output");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("covenant");
};
