import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
    const playlist = Playlist.create({
        name, 
        description
    })

});