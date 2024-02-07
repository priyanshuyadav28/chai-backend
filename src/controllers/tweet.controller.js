import mongoose, {Types, isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"; 
import { Tweet } from "../models/tweet.model.js";


// writing controller for tweets 
// --> functionalites that tweet will have
        // 1. create tweet
        // 2. get user tweets
        // 3. update a tweet 
        // 4. delete a tweet 

const createTweet = asyncHandler(async(req, res) => {
    // destructure the tweet content from req.body
    // console.log("\nreq", req);
    // console.log("\n req.params", req.params);
    // console.log("\n req.body", req.body);

    const {content} = req.body

    // if no content throw error
    if (!content) {
        throw new ApiError(401, "content cant be empty!");
    }
    // console.log("req.body from createTweet: ", req.body);
    // console.log("req.body.user: ",req.body.user);

    // else if content is present save it in db 
    const tweet = await Tweet.create({
        content, 
        owner: req.user._id // this req.user._id we are able to fetch from the auth.middleware's verify jwt 
    })
    // console.log(("\n req", req));
    // console.log(("\n req.body", req.body));
    // console.log("\n user._id", req.user._id)
    // console.log("\n req.params", req.params);
    // console.log("\n req.params._id", req.params._id);

    return res
    .status(201)
    .json(new ApiResponse(200, tweet, "Tweeted Successflly"))

})

const updateTweet = asyncHandler(async (req, res) => {

    const {content} = req.body 
    // console.log("\ncontent: ", content)
    // console.log("\n req.params", req.params);
    // console.log("\n req.params._id", req.params._id);
    // console.log("\n req.user._id", req.user._id);

    const { tweetId } = req.params


    if (!content) {
        throw new ApiError(500, "Tweet cant be empty")
    }

    if (!isValidObjectId(tweetId)) {
       throw new ApiError(400, "Tweet Id not valid");
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "No Tweet found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(500, "Tweet and Owner Do not match");
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            $set: {
                content,
            },
        }, 
        {new: true} // returns the updated value
    ); 

    if (!newTweet) {
        throw new ApiError(500, "Unable to update tweet")
    }

    return res
    .status(201)
    .json(new ApiResponse(200, content, "Tweet Updated Successfully"))

})

const deleteTweet = asyncHandler( async (req, res) => {
    const {tweetId} = req.params

    if (!tweetId) {
        throw new ApiError(500, "No Tweet Found")
    }

    const tweet = await Tweet.findById(tweetId)

     if (!tweet) {
        throw new ApiError(500, "Tweet does not exist")
    }

    await Tweet.findByIdAndDelete(tweet)

    return res
    .status(200)
    .json(200, "Tweet Deleted Successfully")
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const userTweets = Tweet.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            }
        }, 
        {
            $lookup: {
                from: "users", 
                localfield: "owner",
                foreignfield: "_id", 
                as: "ownerDetails", 
            }, 
            pipeline: [
                {
                    $project: {
                        fullName: 1, 
                        username: 1, 
                        avatar: 1
                    }
                }
            ]
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "Tweets Fetched Successfully"))
    
});



export { createTweet, updateTweet, deleteTweet, getUserTweets };