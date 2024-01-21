import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req?.user?._id;

  if (!(channelId && isValidObjectId(channelId))) {
    throw new ApiError(
      `InvalidObjecId: ${channelId} is not a valid ownerId: Error at toggleSubscription controller`
    );
  }

  if (!(subscriberId && isValidObjectId(subscriberId))) {
    throw new ApiError(
      `InvalidObjecId: ${subscriberId} is not a valid ownerId: Error at toggleSubscription controller`
    );
  }

  const subscriptionDocuments = await Subscription.find({
    channel: channelId,
    subscriber: subscriberId,
  }).exec();

  if (subscriptionDocuments.length === 0) {
    await Subscription.create({
      channel: channelId,
      subscriber: subscriberId,
    });
  } else {
    await Subscription.deleteMany({
      channel: channelId,
      subscriber: subscriberId,
    }).exec();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `Channel with id ${channelId} has been ${
          subscriptionDocuments.length === 0 ? "subscribed" : "unsubscribed"
        }`
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  console.log(channelId);

  if (!(channelId && isValidObjectId(channelId))) {
    throw new ApiError(
      `InvalidObjecId: ${channelId} is not a valid ownerId: Error at getUserChannelSubscribers controller`
    );
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        subscriber: 1,
        _id: 1,
      },
    },
  ]);

  const subscribersArray = subscribers.map((document) => document.subscriber);

  if (subscribersArray.length === 0) {
    return res
      .status(200)
      .json(new ApiError(200, {}, "Channel does not have any subscribers"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribersArray,
        `Channel with id: ${channelId} has ${
          subscribersArray.length
        } subscriber${subscribersArray.length > 1 ? "s." : "."}`
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const userId = req?.user?.id;

  if (!(subscriberId && isValidObjectId(subscriberId))) {
    throw new ApiError(
      `InvalidObjecId: ${subscriberId} is not a valid ownerId: Error at getSubscribedChannels controller`
    );
  }

  if (!(userId && isValidObjectId(userId))) {
    throw new ApiError(
      `InvalidObjecId: ${userId} is not a valid ownerId: Error at getSubscribedChannels controller`
    );
  }

  if (!(subscriberId === userId)) {
    throw new ApiError(
      400,
      "UnauthorizedAccess: SubscriberId does not matches with the userId: Error at getSubscribedChannels controller"
    );
  }

  const aggregationResponse = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        subscribedChannel: { $first: "$subscribedChannel" },
        _id: 1,
      },
    },
  ]);

  const subscribedChannelsArray = aggregationResponse.map(
    (document) => document.subscribedChannel
  );

  if (subscribedChannelsArray.length === 0) {
    return res
      .status(200)
      .json(new ApiError(200, {}, "User has not subscribed to any channel"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannelsArray,
        `User with id: ${subscriberId} has subscried to ${subscribedChannelsArray.length} channels`
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
