const { generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { updateRelation, findRelation } = require("../models/relationModel");
const { countEventDocumentsByUser } = require("../models/eventModel");
const { findManyTickets } = require("../models/ticketModel");
const { findUser } = require("../models/userModel");
const { default: mongoose } = require("mongoose");
const { countPost } = require("../models/postModel");

exports.toggleFollowUser = async (req, res, next) => {
  try {
    const currentUserId = req.user.id; // ID of the current user
    const targetUserId = req.query.targetUserId; // ID of the user to toggle follow

    // Check the current state of the relationship
    const relation = await findRelation({ user: currentUserId });
    const isFollowing = relation.following.includes(targetUserId);
    // Prepare update operations based on the current state
    const followerUpdate = isFollowing
      ? { $pull: { followers: currentUserId } }
      : { $addToSet: { followers: currentUserId } };
    const followingUpdate = isFollowing
      ? { $pull: { following: targetUserId } }
      : { $addToSet: { following: targetUserId } };
    // Update target user's followers
    await updateRelation({ user: targetUserId }, followerUpdate);

    // Update current user's following
    const updatedRelation = await updateRelation(
      { user: currentUserId },
      followingUpdate
    );
    return generateResponse(
      { followingStatus: !isFollowing },
      `Successfully toggled follow status`,
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// get followers following count
exports.getProfileCount = async (req, res, next) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user.id);
    const relation = await findRelation({ user: userId });
    const followersCount = relation.followers.length;
    const followingCount = relation.following.length;
    // count of events created by the user
    const eventCount = await countEventDocumentsByUser({ creator: userId });
    // get count of events attended
    const eventsAttended = await findManyTickets([
      {
        $match: { userId: userId },
      },
      {
        $group: {
          _id: "$eventId", // Group by eventId to count unique events
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 }, // Count the number of unique events
        },
      },
    ]);
    return generateResponse(
      {
        followersCount,
        followingCount,
        eventsCreated: eventCount,
        eventsAttended:
          eventsAttended.length !== 0 ? eventsAttended[0].totalCount : 0,
      },
      "Followers and following count fetched",
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// get any user profile count

// get followers following count
exports.getAnyUserProfileCount = async (req, res, next) => {
  try {
    const userId = mongoose.Types.ObjectId(req.params.id);
    const user = await findUser({ _id: userId }).select(
      "firstName lastName image _id email"
    );
    // count of events created by the user
    const eventCount = await countEventDocumentsByUser({ creator: userId });
    // get postCount by user
    const postCount = await countPost({ postedBy: userId });
    // get count of events attended
    const eventsAttended = await findManyTickets([
      {
        $match: { userId: userId },
      },
      {
        $group: {
          _id: "$eventId", // Group by eventId to count unique events
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 }, // Count the number of unique events
        },
      },
    ]);
    // get relation of loggedin user
    const loggedInUserRelation = await findRelation({ user: req.user.id });
    console.log("loggedin user relation", loggedInUserRelation);
    const isFollowing = loggedInUserRelation.following.includes(userId);
    const isFollower = loggedInUserRelation.followers.includes(userId);
    return generateResponse(
      {
        user,
        postCount,
        eventsCreated: eventCount,
        eventsAttended:
        eventsAttended.length !== 0 ? eventsAttended[0].totalCount : 0,
        isFollowing,
        isFollower,
      },
      "Followers and following count fetched",
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
