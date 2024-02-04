import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model";

const createPlaylist = asyncHandler(async (req, res) => {
  // to create a playlist
  // first fetch name, description from user body
  // then write pipeline for video and owner

  const { name, description } = req.body;

  if (!(name || description)) {
    throw new ApiError(400, "All fields are mandatory");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Unable to create Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid UserId");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "Videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$Videos",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
  .status(200)
  .json(new ApiResponse(200, playlists, "Playlist fetched successfully"))
});

export { createPlaylist };
