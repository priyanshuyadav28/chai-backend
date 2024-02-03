import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) { 
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // console.log("\n decoded token: ", decodedToken);

    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        // console.log("\ndecoded token id: ", decodedToken._id);

        if(!user) {
            throw new ApiError(401, "Invalid access Token")
        }
        // console.log("\nreq.user: ", user);
        
        req.user = user; // adding new object to req as user which has the access of user created above  

        // console.log("\n user = ", user);

        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token")
    }
    
})
