import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { response } from "express";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { videos } = req.body;

  if (name.trim() === "" || description.trim() === "") {
    throw new ApiError(
      404,
      "InvalidFieldValues: Name or description field's values must be a valid values"
    );
  }

  const ownerId = req.user._id;

  if (!(ownerId && isValidObjectId(ownerId))) {
    throw new ApiError(
      `InvalidObjecId: ${ownerId} is not a valid ownerId: Error at createPlaylist controller`
    );
  }

  const createdPlaylist = await Playlist.create({
    name,
    description,
    videos,
    owner: ownerId,
  });

  if (!createdPlaylist) {
    throw new ApiError(
      400,
      "Something went wrong while creating the playlist: Error at createPlaylist controller"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        createdPlaylist,
        `Playlist with the _id: ${createdPlaylist._id} has been created successfully`
      )
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!(userId && isValidObjectId(userId))) {
    throw new ApiError(
      `InvalidObjecId: ${userId} is not a valid ownerId: Error at getUserPlaylists controller`
    );
  }

  const playlists = await Playlist.find({
    owner: userId,
  }).exec();

  if (playlists.length === 0) {
    throw new ApiError(
      404,
      `noValuesFound: No playlist has been found for the user with the id: ${userId}: Error st getUserPlaylists controller`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        `Playlists created by the user with the id: ${userId} have been fetched successfully`
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!(playlistId && isValidObjectId(playlistId))) {
    throw new ApiError(
      `InvalidObjecId: ${playlistId} is not a valid playlistId: Error at getPlaylistById controller`
    );
  }

  const aggregateResponse = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $project: {
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
      },
    },
  ]);

  if (aggregateResponse[0].length === 0) {
    throw new ApiError(
      400,
      `No playlist with the id ${playlistId} has been found`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        aggregateResponse,
        `Playlist with the id ${playlistId} has been found successfully`
      )
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!(playlistId && isValidObjectId(playlistId))) {
    throw new ApiError(
      `InvalidObjecId: ${playlistId} is not a valid playlistId: Error at addVideoToPlaylist controller`
    );
  }

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      `InvalidObjecId: ${videoId} is not a valid videoId: Error at addVideoToPlaylist controller`
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId },
    },
    {
      new: true,
    }
  ).exec();

  if (!updatedPlaylist) {
    throw new ApiError(
      404,
      `Playlist with id: ${playlistId} has not been found: Error at addVideoToPlaylist controller`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video has been added to the playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!(playlistId && isValidObjectId(playlistId))) {
    throw new ApiError(
      `InvalidObjecId: ${playlistId} is not a valid playlistId: Error at addVideoToPlaylist controller`
    );
  }

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      `InvalidObjecId: ${videoId} is not a valid videoId: Error at removeVideoFromPlaylist controller`
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  ).exec();

  if (!updatedPlaylist) {
    throw new ApiError(
      404,
      `Playlist with id: ${playlistId} has not been found: Error at removeVideoFromPlaylist controller`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video has been removed from the playlist"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const ownerId = req.user._id;

  if (!(playlistId && isValidObjectId(playlistId))) {
    throw new ApiError(
      `InvalidObjecId: ${playlistId} is not a valid playlistId: Error at deletePlaylist controller`
    );
  }

  const operatioResponse = await Playlist.deleteOne({
    _id: playlistId,
    owner: ownerId,
  }).exec();

  if (operatioResponse.deletedCount === 0) {
    throw new ApiError(
      404,
      "UnauthorizedAction: Playlist cannot be deleted by anyone other than the owner"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `Playlist with the id: ${playlistId} has been deleted successfully`
      )
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const ownerId = req.user._id;
  const setObject = { $set: {} };

  if (!(playlistId && isValidObjectId(playlistId))) {
    throw new ApiError(
      `InvalidObjecId: ${playlistId} is not a valid playlistId: Error at updatePlaylist controller`
    );
  }

  if (!(name || description)) {
    throw new ApiError(
      404,
      "Either name or description field must be provided to for the updation request: Error at updatePlaylist controller"
    );
  }

  if (name) {
    if (name.trim() !== "") {
      setObject.$set.name = name;
    } else {
      throw new ApiError(
        400,
        "InvalidName: Name must be a valid string: Error at updatePlaylist controller"
      );
    }
  }

  if (description) {
    if (description.trim() !== "") {
      setObject.$set.description = description;
    } else {
      throw new ApiError(
        400,
        "InvalidDescription: Description must be a valid string: Error at updatePlaylist controller"
      );
    }
  }

  const updatedPlaylist = await Playlist.updateOne(
    {
      _id: playlistId,
      owner: ownerId,
    },
    setObject
  ).exec();

  if (updatedPlaylist.matchedCount === 0) {
    throw new ApiError(
      404,
      "UnauthorizedAction: Playlist cannot be updated by anyone other than the owner: Error at updatePlaylist"
    );
  }

  if (updatedPlaylist.modifiedCount === 0) {
    throw new ApiError(
      404,
      "For some reason playlist could not be updated: Error at updatePlaylist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `${name ? "Name" : ""} ${name && description ? "and" : ""} ${
          description ? "Description" : ""
        } of the playlist with the id: ${playlistId} updated`
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
