import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  //Step 1: Get channel id: user._d
  //Step 2: Get Total videos throught the id
  //Step 3: Get total likes from the likes collection where comment and tweet feild doesn't exists
  //Step 4: Get total subscribers from the subscribtion collection where the channelId matches
  //Step 5: Get view from the users collection where watchHistory field matches the total videos field in the aggregation pipeline

  const channelId = req?.user?._id;
  console.log(channelId);

  if (!(channelId && isValidObjectId(channelId))) {
    throw new ApiError(
      400,
      "InvalidObjectId: Proivede channelId is either emapty or not a valid objectId: Error at getChannelStats controller"
    );
  }

  const aggregationResult = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "totalVideos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              as: "likesOfVideo",
              let: { videoId: "$_id" },
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
                        {
                          $eq: ["$video", "$$videoId"],
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
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "watchHistory",
              as: "viewsOfVideo",
            },
          },
          {
            $project: {
              _id: 1,
              likeCount: {
                $size: "$likesOfVideo",
              },
              viewsOfVideo: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    }, //till here
    {
      $project: {
        userName: 1,
        createdAt: 1,
        updatedAt: 1,
        subscribersCount: { $size: "$subscribers" },
        videosCount: { $size: "$totalVideos" },
        likesCount: {
          $reduce: {
            input: "$totalVideos",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.likeCount"] },
          },
        },
        viewsCount: {
          $reduce: {
            input: "$totalVideos",
            initialValue: 0,
            in: { $add: ["$$value", { $size: "$$this.viewsOfVideo" }] },
          },
        },
      },
    },
  ]);

  if (!aggregationResult) {
    throw new ApiError(
      404,
      "Something went wrong while fetching the data: Error at getChannelStats controller"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        aggregationResult[0],
        `Stats for channelId: ${channelId} has been fetched successfully.`
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req?.user?._id;

  if (!(channelId && isValidObjectId(channelId))) {
    throw new ApiError(
      400,
      "InvalidObjectId: Proivede channelId is either emapty or not a valid objectId: Error at getChannelStats controller"
    );
  }

  const aggregationResult = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "totalVideos",
        pipeline: [
          {
            $project: {
              owner: 0,
              duration: 0,
              views: 0,
              __v: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
      },
    },
    {
      $project: {
        userName: 1,
        totalVideos: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        aggregationResult,
        `Videos for channelId: ${channelId} has been fetched successfully.`
      )
    );
});

export { getChannelStats, getChannelVideos };
