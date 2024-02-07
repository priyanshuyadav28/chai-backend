import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model";
import Video from "..//models/video.model.js";

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

const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playlistId } = req.params;

  if (!(name || description)) {
    throw new ApiError(404, "Name and Description are required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Playlist Id Invalid");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can edit the playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatePlaylist) {
    throw new ApiError(500, "Unablet to update plalist ");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(404, "Invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist Not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can delete the playlist");
  }

  await findByIdAndDelete(playlist?._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist Deleted Successfully"));
});

const addVideosToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId) {
    throw new ApiError(404, "Playlist Id is required");
  }
  if (!videoId) {
    throw new ApiError(404, "Video Id is required");
  }

  const playlist = await Playlist.findById(playlistId?._id);
  const video = await Video.findById(videoId?._id);

  if (!playlist) {
    throw new ApiError(404, "Playlist Not found");
  }
  if (!video) {
    throw new ApiError(404, "Video Not found");
  }

  if (
    (playlist.owner?.toString() && video.owner.toString()) !==
    req.user?._id.toString()
  ) {
    throw new ApiError(400, "only owner can add video to thier playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist._id,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "failed to add video to playlist please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Added video to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid PlaylistId or videoId");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "Playlist Not Found");
  }

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  const updatedPlaylist = await Playlist.findByIdAndDelete(
    playlistId,
    {
      $pull: {
        video: videoId,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(404, "Playlist ID Not found ");
  }

  const playlistVideos = await Playlist.aggregate([
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
        as: "playListVideos"
      }
    },
    {
      $match: {
        "videos.isPublished": true
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos"
        }
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid UserId");
  }

  const playlists = await Playlist.aggregate([
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
    .json(new ApiResponse(200, playlists, "Playlist fetched successfully"));
});

export {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideosToPlaylist,
  removeVideoFromPlaylist,
  getUserPlaylists,
};
