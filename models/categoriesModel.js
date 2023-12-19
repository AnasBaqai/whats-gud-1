const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");
const categoriesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  subCategory: [
    {
      _id: {
        type: mongoose.Types.ObjectId,
        default: mongoose.Types.ObjectId,
      },
      name: {
        type: String,
      },
      // Add any other properties you want for subCategory documents
    },
  ],
});
categoriesSchema.plugin(mongoosePaginate);
categoriesSchema.plugin(aggregatePaginate);

const categoriesModel = model("Category", categoriesSchema);

//create utility functions to create, read, update, and delete events

exports.createCategories = (obj) => categoriesModel.create(obj);

exports.findCategory = (query) => categoriesModel.find(query);

exports.updateCategory = (query, obj) =>
  categoriesModel.findOneAndUpdate(query, obj, { new: true });

exports.deleteCategory = (query) => categoriesModel.findOneAndDelete(query);


