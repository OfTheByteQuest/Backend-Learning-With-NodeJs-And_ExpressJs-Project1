import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(
      404,
      "fieldsEmptyError: videoId is missing, it has not been provided"
    );
  }

  const options = {
    page,
    limit,
  };

  if (!(page && limit)) {
    throw new ApiError(
      404,
      "fieldsEmptyError:  is missing, it has not been provided"
    );
  }

  const aggregateComments = await Comment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        $from: "videos",
        $localField: "video",
        $foreignField: "_id",
        as: "video",
      },
    },
    {
      $lookup: {
        $from: "users",
        $localField: "owner",
        $foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
  ]);

  //other approach to agination without the use of mongoose-aggregate-pagination

  // const aggregateComments = await Comment.aggreagate([
  //   {
  //     $match: {
  //       _id: new mongoose.Types.ObjectId(videoId),
  //     }
  //   },
  //   {
  //     $skip: ( page - 1) * limit
  //   },
  //   {
  //     $limit: limit
  //   }
  // ])

  if (!aggregateComments) {
    throw new ApiError(
      404,
      "Somwthing went wrong with the database in the comment's controllers"
    );
  }

  const comments = await Comment.mongooseAggregatePaginate(
    aggregateComments,
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        comments[0],
        `Comments have been fetched successfully for page ${page} with limit ${limit}`
      )
    );
});

const addComments = asyncHandler(async (req, res) => {
  const videoId = req.params;
  const { content, ownerId } = req.body;

  if (
    [content, videoId, ownerId].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(
      400,
      "fieldsEmptyError: All the fields are required in the form"
    );
  }

  //check whether the comment is already in the database

  const addedComment = await User.create({
    content,
    video: videoId,
    owner: ownerId,
  });

  const newComment = await Comment.findById(addedComment._id);

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment has been added succfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const commentId = req.params;
  const { content, ownerId } = req.body;

  if (!commentId) {
    throw new ApiError(
      "commentIdNotPresent: Comment Id has not been provided as params in the udateComment controller"
    );
  }

  const updatedCommentOutcome = await Comment.updateOne(
    { _id: commentId, owner: ownerId },
    { $set: { content: content } }
  ).then((outcomeObject) =>
    console.log("Outcome Object of the update comment command: ", outcomeObject)
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedCommentOutcome,
        `Comment with id ${commentId} has been updated successfully`
      )
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const commentId = req.params;

  if (!commentId) {
    throw new ApiError(
      "commentIdNotPresent: Comment Id has not been provided as params in the deleteComment controller"
    );
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId).then(() =>
    console.log("Comment has been deleted successfully: ", deleteComment)
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedComment._id,
        `Comment with the id ${deleteComment._id} has been deleted successfully`
      )
    );
});

export { getVideoComments, addComments, updateComment, deleteComment };
