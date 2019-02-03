const { Model } = require("objection");

class Covenant extends Model {
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
}
