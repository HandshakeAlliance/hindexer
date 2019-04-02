exports.up = async function(knex) {
  await knex.schema.createTable("block", function(t) {
    t.bigIncrements("id").primary();

    t.integer("height").notNull();

    //Re: Binary -> Text may actually be faster: http://engineering.pivotal.io/post/bytea_versus_text_in_postgresql/
    //I've seen some critisim of that post though, so some independent testing of this speed should be considered.
    t.binary("hash").notNull();

    t.binary("prev_hash").notNull();

    t.binary("merkle_root").notNull();

    t.bigInteger("time").notNull();

    t.bool("orphaned")
      .notNull()
      .default(false);

    t.integer("stripped_size").notNull();

    t.integer("size").notNull();

    //I think weight can be calculated live, but for now keep it.
    t.integer("weight").notNull();

    t.integer("version").notNull();

    t.string("witness_root").notNull();

    t.string("tree_root").notNull();

    t.string("filter_root").notNull();

    t.string("reserved_root").notNull();

    t.string("nonce").notNull();

    t.bigInteger("bits").notNull();

    t.string("chainwork").notNull();

    t.string("mined_by").notNull();

    t.integer("total_txs").notNull();

    t.bigInteger("fees").notNull();

    //With how much precision we are storing here, I'm pretty sure this is better to not store, and to calculate live,
    //but that can be in the next update XXX.
    t.float("difficulty", 18).notNull();

    //This can definitely be caluclated in realtime quite easily.
    t.bigInteger("reward").notNull();

    //Indexes
    t.index("height");
    t.index("prev_hash");
    t.unique("hash");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("block");
};
