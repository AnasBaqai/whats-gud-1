const { generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { updateRelation, findRelation } = require("../models/relationModel");

exports.toggleFollowUser = async (req, res, next) => {
  try {
    const currentUserId = req.user.id; // ID of the current user
    const targetUserId = req.query.targetUserId; // ID of the user to toggle follow
    console.log(currentUserId, targetUserId);
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
    await updateRelation({ user: currentUserId }, followingUpdate);
    return generateResponse(
      {},
      `Successfully toggled follow status for user ${targetUserId}`,
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
