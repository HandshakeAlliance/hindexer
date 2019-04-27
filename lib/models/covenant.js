const { Model } = require("objection");
const Resource = require("hsd/lib/dns/resource.js");

const Covenant = require("hsd/lib/primitives/covenant.js");

class MCovenant extends Model {
  static get tableName() {
    return "covenant";
  }

  static get relationMappings() {
    const Output = require("./output.js");

    return {
      output: {
        relation: Model.BelongsToOneRelation,
        modelClass: Output,
        join: {
          from: "covenant.output_id",
          to: "output.id"
        }
      }
    };
  }

  static async format(covenant) {

    covenant = Covenant.fromJSON(covenant);

    return covenant.getJSON();

  }
}

module.exports = MCovenant;
