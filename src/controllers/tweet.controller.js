import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const tweetUser = asyncHandler(async (req, res) => {
    // get the comment from req.body 

    const {tweetContent} = req.body
    console.log("\ntweetContent: ", tweetContent);
    
    if (!tweetContent) {
        throw new ApiError(401, "Tweet cant be empty");
    }

    const tweet = await Tweet.create( {
        content: tweetContent
    })


    return res
    .status(200)
    .json(200, ApiResponse(200, tweet, "Tweet saved Successfully."))

})




export { tweetUser };