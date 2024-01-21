import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      "videoIdNotPresent: Comment Id has not been provided as params in the getVideoComments controller"
    );
  }

  if (!(page && limit)) {
    throw new ApiError(
      404,
      "fieldsEmptyError: Page or/and limit is missing, it has not been provided"
    );
  }

  const options = {
    page: Number(page),
    limit: Number(limit),
  };

  const aggregateComments = await Comment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
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
      "Something went wrong with the database in the comment's controllers"
    );
  }

  const comments = await Comment.aggregatePaginate(aggregateComments, options);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        comments,
        `Comments have been fetched successfully for page ${page} with limit ${limit}`
      )
    );
});

const addComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const ownerId = req?.user?._id;
  const { content } = req.body;

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      404,
      "InvalidVideoId: The provided id is not a valid ObjectId: Error at addComments controller"
    );
  }

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      404,
      "InvalidVideoIs: The provided id is not a valid ObjectId: Error at addComments controller"
    );
  }

  if (!(content && content.trim() !== "")) {
    throw new ApiError(
      400,
      "fieldsEmptyError: All the fields are required in the form"
    );
  }

  //check whether the comment is already in the database

  const addedComment = await Comment.create({
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
  const { commentId } = req.params;
  const ownerId = req?.user?._id;
  const { content } = req.body;

  if (!(commentId && isValidObjectId(commentId))) {
    throw new ApiError(
      "commentIdNotPresent: Comment Id has not been provided as params in the udateComment controller"
    );
  }

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      "ownerIdNotPresent: Owner Id has not been provided as params in the udateComment controller"
    );
  }

  const updatedCommentOutcome = await Comment.updateOne(
    { _id: commentId, owner: ownerId },
    { $set: { content: content } }
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
  const { commentId } = req.params;
  const ownerId = req?.user?._id;

  if (!(commentId && isValidObjectId(commentId))) {
    throw new ApiError(
      "commentIdNotPresent: Comment Id has not been provided as params in the deleteComment controller"
    );
  }

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      "commentIdNotPresent: Owner Id has not been provided as params in the udateComment controller"
    );
  }

  await Comment.deleteOne({
    _id: commentId,
    owner: ownerId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        commentId,
        `Comment with the id ${commentId} has been deleted successfully`
      )
    );
});

export { getVideoComments, addComments, updateComment, deleteComment };
