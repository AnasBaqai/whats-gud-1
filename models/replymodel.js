const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const replySchema = new Schema(
  {
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    media: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const ReplyModel = model("Reply", replySchema);

exports.createReply = (obj) => ReplyModel.create(obj);

exports.findReply = (query) => ReplyModel.findOne(query);

exports.updateReply = (query, obj) => ReplyModel.findOneAndUpdate(query, obj, { new: true });



