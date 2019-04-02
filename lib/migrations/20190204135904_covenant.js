exports.up = async function(knex) {
  await knex.schema.createTable("covenant", function(t) {
    t.increments("id")
      .unsigned()
      .primary();

    //Potentially optimize this by only saving the number, and then have a conversion table. TODO
    t.string("action").notNull();

    t.string("name_hash");

    //This needs to be reviewed.
    t.text("data");

    t.string("nonce");

    t.integer("output_id")
      .references("id")
      .inTable("output");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("covenant");
};
