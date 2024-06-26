"use strict";

const { Schema, model } = require("mongoose");
const { sign } = require("jsonwebtoken");
const { ROLES } = require("../utils/constants");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");

const userSchema = new Schema(
  {
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    dob: { type: Date },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String },
    location: {
      type: {
        type: String,
        enum: ["Point"], // Restrict type to 'Point'
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // Default coordinates if not provided
      },
    },
    image: { type: String, default: null },
    role: { type: String, default: "user", enum: Object.values(ROLES) },
    preferredEvents: [{ type: Schema.Types.ObjectId, ref: "EventType" }],
    isActive: { type: Boolean, default: false },
    isComplete: { type: Boolean, default: false },
    fcmToken: { type: String },
    refreshToken: { type: String },
    googleId: { type: String },
    facebookId: { type: String },
    appleId: { type: String },
    gender: { type: String },
    preferredCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category.subCategory",
      },
    ],
    preferredDJ: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    prefferedStreamers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    address: {
      city: { type: String, default: null },
      state: { type: String, default: null },
      country: { type: String, default: null },
    },
    stripeAccountId: { type: String, default: null },
    bio: { type: String, default: null },
    avatar: { type: String, default: null },
  },

  { timestamps: true }
);

// register pagination plugin to user model
userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);

userSchema.index({ "location.coordinates": "2dsphere" });

const UserModel = model("User", userSchema);

// create new user
exports.createUser = (obj) => UserModel.create(obj);

// find user by query
exports.findUser = (query) => UserModel.findOne(query);
exports.findUsers = (query) => UserModel.find(query);

// update user
exports.updateUser = (query, obj) =>
  UserModel.findOneAndUpdate(query, obj, { new: true });


exports.findManyUsers = (query) => UserModel.aggregate(query);
// get all users
exports.getAllUsers = async ({ query, page, limit, responseKey = "data" }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: UserModel,
    query,
    page,
    limit,
  });

  return { [responseKey]: data, pagination };
};

// generate token
exports.generateToken = (user) => {
  const token = sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  return token;
};

// generate refresh token
exports.generateRefreshToken = (user) => {
  // Generate a refresh token
  const refreshToken = sign({ id: user._id }, process.env.REFRESH_JWT_SECRET, {
    expiresIn: process.env.REFRESH_JWT_EXPIRATION, // Set the expiration time for the refresh token
  });

  return refreshToken;
};

// get FcmToken
exports.getFcmToken = async (userId) => {
  const { fcmToken } = await UserModel.findById(userId);
  return fcmToken;
};

// remove user ( HARD DELETE)
exports.removeUser = (userId) => UserModel.findByIdAndDelete(userId);
