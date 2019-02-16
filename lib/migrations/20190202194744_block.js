exports.up = async function(knex) {
  await knex.schema.createTable("block", function(t) {
    t.bigIncrements("id").primary();

    t.bigInteger("height").notNull();

    //Re: Binary -> Text may actually be faster: http://engineering.pivotal.io/post/bytea_versus_text_in_postgresql/
    //I've seen some critisim of that post though, so some independent testing of this speed should be considered.
    t.binary("hash").notNull();

    t.binary("prev_hash").notNull();

    t.binary("merkle_root").notNull();

    t.bigInteger("time").notNull();

    t.bool("orphaned")
      .notNull()
      .default(false);

    //? Maybe not needed.
    //We can add this on response time.
    t.integer("strippedsize");
    //Needs all the txs to calculate, so let's keep this.
    t.integer("size");
    t.integer("weight");
    t.integer("version");
    t.string("witnessroot");
    t.string("filterroot");
    t.string("reservedroot");
    t.string("nonce");
    t.bigInteger("time");
    t.bigInteger("bits");
    t.string("chainwork");
    t.string("previousblockhash");
    t.string("nextblockhash");
    t.string("mined_by");
    t.bigInteger("total_txs");
    t.bigInteger("fees");
    t.bigInteger("difficulty");
    //This can definitely be caluclated in realtime quite easily.
    t.bigInteger("reward");

    //Indexes
    t.index("height");
    t.index("prev_hash");
    t.unique("hash");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("block");
};
