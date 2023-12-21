const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const postSchema = new Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    media: [{ type: String }], // Array of media URLs (e.g., S3 bucket URLs)
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of user IDs who shared the post
  },
  { timestamps: true }
);

const PostModel = model("Post", postSchema);

// create post

exports.createPost = (obj) => PostModel.create(obj);

// find post by query
exports.findPost = (query) => PostModel.find(query);

// update post
exports.updatePost = (query, obj) =>
  PostModel.findOneAndUpdate(query, obj, { new: true });

// get all posts
exports.getAllPosts = async ({ query, page, limit, responseKey = "data" }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: PostModel,
    query,
    page,
    limit,
  });

  return { [responseKey]: data, pagination };
};
