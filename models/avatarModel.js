const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");
// {
//   id: 1,
//   name: 'Artist',
//   url: require('../../Resources/Images/avatars/PNG/Artist.png'),
//   mime: 'image/png',
//   desc: 'Software Engineer',
// }
const avatarSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: false,
  },
  mime: {
    type: String,
    required: false,
  },
  desc: {
    type: String,
    required: false,
  },
});

avatarSchema.plugin(mongoosePaginate);
avatarSchema.plugin(aggregatePaginate);

const avatarModel = model("Avatar", avatarSchema);

//create utility functions to create, read, update, and delete avatars

exports.createAvatar = (obj) => avatarModel.create(obj);

exports.findAvatar = (query) => avatarModel.findOne(query);

exports.updateAvatar = (query, obj) => avatarModel.findOneAndUpdate(query, obj, { new: true });

exports.deleteAvatar = (query) => avatarModel.findOneAndDelete(query);

exports.getAllAvatars = (query) => avatarModel.find(query);


