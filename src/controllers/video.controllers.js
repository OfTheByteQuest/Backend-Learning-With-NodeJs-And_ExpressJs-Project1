import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinary.js";
import { response } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  //have already got the all the query params
  //create an array
  //match the userId if provided otherwise now
  //if query is implement the atlas aggregation pipeline search stage, otherwise throw error
  //if sortType and sort both are present then sort the documents other not

  const pipelineArray = [];

  //Here we are using Atlas aggregation search stage which is not possible
  //if the collections are not sotred on the Atlas servers, in that case
  //simple text-based search is possible
  //Step 1: Create Atlas search indexes on the atlas search section
  //Step 2: Add mapped fields to the atlas search or not
  //Step 3: Store particular fields in the atlas search or not
  //Step 4: Defining the $search stage, here we are using the "text" operator of atlas search

  if (query) {
    pipelineArray.push({
      $search: {
        text: {
          path: ["description", "title"],
          query: String(query),
        },
      },
    });
  } else {
    throw new ApiError(
      400,
      "Query is not present in the getAllVideos controller"
    );
  }

  if (userId && isValidObjectId(userId)) {
    pipelineArray.push({
      $match: {
        owner: mongoose.Types.ObjectId(userId),
      },
    });
  }

  if (sortType && sortBy) {
    pipelineArray.push(
      sortType === "asc"
        ? {
            $sort: {
              [sortBy]: 1,
            },
          }
        : {
            $sort: {
              [sortBy]: -1,
            },
          }
    );
  }

  const videosAggregate = await Video.aggregate(pipelineArray);

  if (!videosAggregate.length) {
    throw new ApiError(
      "No videos were found in the pipeline or have been fethed from the database: Error at getAllVideos controller"
    );
  }

  const options = {
    page: Number(page),
    limit: Number(limit),
  };

  const videosArray = await Video.aggregatePaginate(videosAggregate, options);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videosArray,
        `Videos for page: ${page} and limit: ${limit} have been fetched successfully`
      )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { ownerId } = req?.user?._id;

  if (!(title && description && ownerId)) {
    throw new ApiError(
      400,
      "fieldsEmptyError: All the fields are required to be provided"
    );
  }

  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(
      400,
      "InvalidTitleAndDescription: Invalid title and description length: Error at pubslishVideo controller"
    );
  }

  if (!isValidObjectId(ownerId)) {
    throw new ApiError(
      400,
      "InvalidUserId: Invalid ObjectId has been provided as ownerId"
    );
  }

  const existedVideo = await Video.findOne({
    $or: [{ title }, { description }],
  });

  if (existedVideo) {
    throw new ApiError(
      404,
      "Video is already present in the database: Error at publishVideo contoller"
    );
  }

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!(videoFileLocalPath && thumbnailLocalPath)) {
    throw new ApiError(
      400,
      "video file and thumbnail have not been provided: Error at publishVideo contoller"
    );
  }

  const uploadedVideoFile = await uploadOnCloudinary(videoFileLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!(uploadedVideoFile && uploadedThumbnail)) {
    throw new ApiError(
      404,
      "Something went wrong during uploadin thumbnail and videoFile: Error at publishVideo contoller"
    );
  }

  const addedVideo = await Video.create({
    title,
    description,
    owner: ownerId,
    videoFile: {
      url: uploadedVideoFile?.url || "",
      publicId: uploadedVideoFile.public_id || "",
    },
    thumbnail: {
      url: uploadedThumbnail?.url || "",
      publicId: uploadedThumbnail.public_id || "",
    },
    duration: uploadedVideoFile.duration || "",
    isPublished: true,
  });

  const video = await Video.findById(addedVideo._id);

  if (!video) {
    throw new ApiError(500, "Video uploading failed for some reason.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video with id ${addedVideo._id} has been uploaded successfully`
      )
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(
      404,
      "InvalidVideoIs: The provided id is not a valid ObjectId: Error at getVideoById controller"
    );
  }

  // const video = await Video.findById(videoId).populate(
  //   "owner",
  //   "-_id -avatar -coverImage -password -refreshToken -createdAt -updatedAt"
  // );
  //Other ways of popluating this doc.populate({path: "owner", select: {_id: 0, ...and so on}})
  //Not efficient way of populating insated aggregation pipelines are more efficient as they make a single query unlike mongoose's methods

  const video = Video.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipepline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
              pipleline: [
                {
                  $project: {
                    subscribers: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: "$subscribers" },
              isSubscribed: {
                $cond: {
                  $if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                },
                $then: true,
                $else: false,
              },
            },
          },
          {
            $project: {
              userName: 1,
              fullName: 1,
              "avatar.url": 1,
              isSubscribed: true,
              subscribersCount: true,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        let: { videoId: "$_id" },
        as: "likes",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$video", "$$videoId"] },
                  { comment: { $exists: false } },
                ],
              },
            },
          },
          {
            $project: {
              comment: 0,
              createdAt: 0,
              updatedAt: 0,
              tweet: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        owner: { $first: "$owner" },
        isLiked: {
          $cond: {
            $if: { $in: [req.user._is, "$likes.likedBy"] },
            $then: true,
            $else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(
      404,
      "fileFetchingError: Something went wrong while fetching vedio from the databse: Error at getVideoById controller"
    );
  }

  Video.findByIdAndUpdate(
    video?._id,
    {
      $inc: {
        views: 1,
      },
    },
    { new: true }
  );

  await User.findByIdAndUpdate(req.user?.id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video[0],
        `Video with the id: ${video.id} has been fetched successfully`
      )
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  //Step 1: destructure the request params and other paramteres
  //Step 2: Check if the required parameters are provided
  //Step 3: Check whether the owner matched the user._id
  //Step 4: On coditional logic update the fields with the $set operator: title, description, thumbnail
  //Step 5: Uplaod the thumbnail, get its url and update the thumbnail field

  const { videoId } = req.params;

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      400,
      `NotValidObjectId: Provided videoId ${videoId} is not a valid object id: Error at updateVideo controller`
    );
  }

  // const videoFileLocalPath = req.files?.videoFile[0].path; //not allowed as that would be equal to uploading a new video file

  const { title, description } = req.body;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  const oldVideo = await Video.findById(videoId);

  if (!(oldVideo?.owner === req.user._id)) {
    throw new ApiError(
      400,
      "unauthorizedRequest: Only the owner of the video is allowed to update it: Error at updateVideo controller"
    );
  }

  if (thumbnailLocalPath) {
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedThumbnail) {
      throw new ApiError(
        404,
        "Something went wrong during uploading thumbnail: Error at updateVideo contoller"
      );
    }

    setObject.$set.thumbnail.url = uploadedThumbnail.url;
    setObject.$set.thumbnail.publicId = uploadedThumbnail.public_id;

    const deletedThumbnailResponse = await deleteFromCloudinary(
      oldVideo.thumbnail.publicId
    );

    if (!(deletedThumbnailResponse === "ok")) {
      throw new ApiError(
        500,
        "FileNotDeletedFromServer: Thumbnail file could not be deleted from Cloudinary: Error at updateVideo controller"
      );
    }
  }

  const setObject = { $set: {} };

  if (title) {
    setObject.$set.title = title;
  }

  if (description) {
    setObject.$set.description = description;
  }

  const updatedVideo = await Video.findByIdAndUpdate(videoId, setObject, {
    new: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        `Video with the id: ${videoId} has been updated with ${
          title ? `${title}, ` : ""
        }${description ? `description and ` : ""}${
          thumbnail ? `thumbnail` : ""
        }`
      )
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //Step 1: Check whther the owner meets the userId
  //Step 2: Fetch the video docuemnet
  //Step 3: Delete the video on cloudinary
  //Step 4: Delete the video docuement from MongoDB

  const { videoId } = req.params;

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      400,
      "InvalidObjectId: Proivede videoId is either emapty or not a valid objectId: Error at deleteVideo controller"
    );
  }

  if (!(oldVideo?.owner === req.user._id)) {
    throw new ApiError(
      400,
      "unauthorizedRequest: Only the owner of the video is allowed to update it: Error at updateVideo controller"
    );
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(
      404,
      "Video cannot be fetched from the database: Error at deleteVideo controller"
    );
  }

  const deletedVideoResponse = await deleteFromCloudinary(
    video?.videoFile?.url
  );
  const deletedThumbnailResponse = await deleteFromCloudinary(
    video?.thumbnail?.url
  );

  if (!(deletedThumbnailResponse === "ok" && deletedVideoResponse === "ok")) {
    throw new ApiError(
      404,
      "ServerDeletionError: Video or thumbnail could not be deleted from Cloudinary: Error at deleteVideo controller"
    );
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  const deletedComments = await Comment.deleteMany({ video: videoId });
  const deletedLikes = await Like.deleteMany({
    $and: [{ video: videoId }, { $tweet: { $exists: false } }],
  });

  if (deleteVideo && deletedComments && deletedLikes) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          `Video with id: ${deletedVideo._id} has been successfully deleted`
        )
      );
  } else {
    throw new ApiError(
      404,
      "Video could not be deleted: Error at deleteVideo controller"
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  //Step 1: Check whther the owner meets the userId
  //Step 2: Fetch the video docuemnet
  //Step 3: Change the isPublished field to true
  const { videoId } = req.params;

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      400,
      "InvalidObjectId: Proivede videoId is either emapty or not a valid objectId: Error at deleteVideo controller"
    );
  }

  if (!(oldVideo?.owner === req.user._id)) {
    throw new ApiError(
      400,
      "unauthorizedRequest: Only the owner of the video is allowed to update it: Error at updateVideo controller"
    );
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: true ? false : true,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(
      404,
      "Video has not fetched or isPublished field has not been updated"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        `isPublished filed has successfully been updated from ${
          updatedVideo.isPublished
        } to ${!updatedVideo.isPublished}`
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
