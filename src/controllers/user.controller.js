import {asyncHandler} from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js"
import Jwt from "jsonwebtoken";

// method to generate access token 
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // find the user to generate token 
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        console.log("accessToken: ", accessToken);
        console.log("refreshToken: ", refreshToken);


        // insert refresh token in user object 
        user.refreshToken = refreshToken
        // save the refresh token in db model
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


// register/signup user 
const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty 
    // check if user already exist: username, email
    // check for images, eheck for avatar 
    // upload them on cloudinary, avatar 
    // create user object - create entry in db 
    // remove password and refresh token field from response 
    // check for user creation 
    // return res

    const {fullName, email, username, password } = req.body

    // if (fullName === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    } 
    
    // check for user already exist 
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists ")
    }

    // check for avatar and cover image 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log("req.files",req.files);
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath; 

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar local path file is required")
    }
    
    // upload coverImage and avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create a user and save it 
    const user = await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })


    // remove password and refreshtoken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong while registering the user")
    }

    // resposne for successfull user creation 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registerd Successfully")
    )



} ) 


// login user 
const loginUser = asyncHandler( async (req, res) => {
    // req body -> data 
    // username, password exist or not 
    // check user exist or not 
    // if exist compare the password -> password check 
    // access and refresh token 
    // send cookies 
    
    const {email, username, password} = req.body
    console.log("email: ", email);
    
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}],
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // now when user found password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // generate access and refresh token 
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    // send cookie 
    const options = {
        httpOnly: true, 
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            }, 
            "User logged In successfully "
        )
    )

})


// logout user 
const logoutUser = asyncHandler(async (req, res) => {
    
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                refreshToken: undefined
            }
        }, 
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRequestToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incommingRequestToken) {
        throw ApiError(401, "Unathorized request")
    }

    try {
        const decodedToken = Jwt.verify(
            incommingRequestToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw ApiError(401, "Invalid refresh token");
        }
    
        if (incommingRequestToken !== user?.refreshToken) {
            throw ApiError(401, "refresh token is expired or used");
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        const options = {
            httpOnly: true, 
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken}, 
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
    
    


})


export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken 
};
