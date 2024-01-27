import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        // console.log("\ntoken: ", token);
    
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // console.log("\n decoded token: ", decodedToken);

    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        // console.log("\ndecoded token id: ", decodedToken._id);

        if(!user) {
            // TODO: discuss about fronend
            throw new ApiError(401, "Invalid access Token")
        }
        // console.log("\nreq.user: ", user);
        
        req.user = user; 

        // console.log("\n user = ", user);

        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token")
    }
    
})
