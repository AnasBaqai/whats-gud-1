const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { getMongooseAggregatePaginatedData } = require("../utils");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const commentSchema = new Schema(
  {
    commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    media: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
  },
  { timestamps: true }
);
commentSchema.plugin(mongoosePaginate);
commentSchema.plugin(aggregatePaginate);

const CommentModel = model("Comment", commentSchema);

exports.createComment = (obj) => CommentModel.create(obj);

exports.findComment = (query) => CommentModel.findOne(query);

exports.updateComment = (query, obj) =>
  CommentModel.findOneAndUpdate(query, obj, { new: true });


exports.getAllComments = async ({ query, page, limit, responseKey = "data" }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: CommentModel,
    query,
    page,
    limit,
  });

  return { data, pagination };
}

