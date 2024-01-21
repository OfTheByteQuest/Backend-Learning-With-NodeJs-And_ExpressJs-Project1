import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const ownerId = req?.user?._id;

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at toggelVideoLike controller`
    );
  }
  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      `InvalidObjecId: ${videoId} is not a valid ownerId: Error at toggelVideoLike controller`
    );
  }

  const like = await Like.findOne({
    $and: [
      { likedBy: ownerId },
      { video: videoId },
      { comment: { $exists: false } },
      { tweet: { $exists: false } },
    ],
  });

  // console.log(like);

  var addedLike = undefined;
  var updatedLike = undefined;
  if (!like) {
    addedLike = await Like.create({
      video: videoId,
      likedBy: ownerId,
    });
  } else {
    updatedLike = await Like.findOneAndDelete({
      $and: [{ comment: { $exists: false } }, { tweet: { $exists: false } }],
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        like ? updatedLike : addedLike,
        `Like has been toggeled from ${
          like ? "liked to disliked" : "disliked to liked"
        }`
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId, videoId } = req.params;
  const ownerId = req?.user?._id;

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at toggelCommentLike controller`
    );
  }
  if (!(commentId && isValidObjectId(commentId))) {
    throw new ApiError(
      `InvalidObjecId: ${commentId} is not a valid ownerId: Error at toggelCommentLike controller`
    );
  }

  const like = await Like.findOne({
    likedBy: ownerId,
    comment: commentId,
  });

  var addedLike = undefined;
  var updatedLike = undefined;
  if (!like) {
    addedLike = await Like.create({
      comment: commentId,
      likedBy: ownerId,
      video: videoId,
    });
  } else {
    updatedLike = await Like.findOneAndDelete({
      likedBy: ownerId,
      comment: commentId,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        like ? updatedLike : addedLike,
        `Like has been toggeled from ${
          like ? "liked to disliked" : "disliked to liked"
        }`
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId, videoId } = req.params;
  const ownerId = req?.user?._id;

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at toggelTweetLike controller`
    );
  }
  if (!(tweetId && isValidObjectId(tweetId))) {
    throw new ApiError(
      `InvalidObjecId: ${tweetId} is not a valid ownerId: Error at toggelTweetLike controller`
    );
  }

  const like = await Like.findOne({
    likedBy: ownerId,
    tweet: tweetId,
  });

  var addedLike = undefined;
  var updatedLike = undefined;

  if (!like) {
    addedLike = await Like.create({
      tweet: tweetId,
      likedBy: ownerId,
      video: videoId,
    });
  } else {
    updatedLike = await Like.findOneAndDelete({
      likedBy: ownerId,
      tweet: tweetId,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        like ? updatedLike : addedLike,
        `Like has been toggeled from ${
          like ? "liked to disliked" : "disliked to liked"
        }`
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const ownerId = req?.user?._id;

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at getLikedVideos controller`
    );
  }

  const aggregationResponse = await Like.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            {
              $or: [
                { $eq: [{ $type: "$comment" }, "missing"] },
                { $eq: ["$comment", null] },
              ],
            },
            {
              $or: [
                { $eq: [{ $type: "$tweet" }, "missing"] },
                { $eq: ["$tweet", null] },
              ],
            },
            { likedBy: new mongoose.Types.ObjectId(ownerId) },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "video",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "likes",
              let: { videoId: "$_id" },
              as: "videoLikes",
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $or: [
                            { $eq: [{ $type: "$comment" }, "missing"] },
                            { $eq: ["$comment", null] },
                          ],
                        },
                        {
                          $or: [
                            { $eq: [{ $type: "$tweet" }, "missing"] },
                            { $eq: ["$tweet", null] },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              likesCount: { $size: "$videoLikes" },
              owner: { $first: "$owner" },
            },
          },
          {
            $project: {
              videoLikes: 0,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        likedVideo: { $first: "$likedVideo" },
      },
    },
  ]);

  const videoArray = aggregationResponse.map((document) => {
    return document["likedVideo"];
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        aggregationResponse.length === 0 ? {} : videoArray,
        aggregationResponse.length === 0
          ? `OwnerId: ${ownerId} has no liked videos`
          : `Videos liked by ownerId: ${ownerId} have been fetched successfully`
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
