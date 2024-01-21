import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { response } from "express";

const createTweet = asyncHandler(async (req, res) => {
  const ownerId = req?.user?._id;
  const { content } = req.body;

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at createTweet controller`
    );
  }
  if (!content.trim()) {
    throw new ApiError(
      `InvalidObject: ${content} is not a valid candidate for content field of a tweet: Error at createTweet controller`
    );
  }

  const addedTweet = await Tweet.create({
    owner: ownerId,
    content,
  });

  if (!addedTweet) {
    throw new ApiError(
      `dbError: Somwthing went wrong while adding the tweet to the database: Error at createTweet controller`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, addedTweet, "Tweet has been added successfully")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const ownerId = req?.user?._id;

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      404,
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at getUserTweets controller`
    );
  }

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(ownerId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              userName: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likeDetails",
        },
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userTweets[0].length === 0 ? {} : userTweets,
        userTweets[0].length === 0
          ? `OwnerId: ${ownerId} has no tweets`
          : `Tweets by ownerId: ${ownerId} have been fetched successfully`
      )
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  //@params tweetId

  const tweetId = req?.params?.tweetId;
  const ownerId = req?.user?._id;
  const content = req?.body?.content;

  if (!(tweetId && isValidObjectId(tweetId))) {
    throw new ApiError(
      404,
      `InvalidObjecId: ${tweetId} is not a valid tweetId: Error at updateTweet controller`
    );
  }
  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      404,
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at updateTweets controller`
    );
  }

  if (!content.trim()) {
    throw new ApiError(
      404,
      `InvalidObject: ${content} is not a valid candidate for content field of a tweet: Error at updateTweet controller`
    );
  }

  const updatedTweet = await Tweet.findOneAndUpdate(
    { _id: tweetId, owner: ownerId },
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(
      404,
      `Either the tweet for the provided tweetId does not exists or ownerId: ${ownerId} is not allowed to update the tweet: Error at updateTweet controller`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedTweet,
        `Tweet with id: ${tweetId} has been updated successfully}`
      )
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req?.params?.tweetId;
  const ownerId = req?.user?._id;

  if (!(tweetId && isValidObjectId(tweetId))) {
    throw new ApiError(
      404,
      `InvalidObjecId: ${tweetId} is not a valid tweetId: Error at updateTweet controller`
    );
  }
  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      404,
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at updateTweets controller`
    );
  }

  const deletedTweet = await Tweet.deleteOne({ _id: tweetId, owner: ownerId });

  if (!deletedTweet) {
    throw new ApiError(
      404,
      `Either the tweet for the provided tweetId does not exists or ownerId: ${ownerId} is not allowed to update the tweet: Error at updateTweet controller`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedTweet,
        `Tweet with id: ${tweetId} has been deleted successfully}`
      )
    );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
