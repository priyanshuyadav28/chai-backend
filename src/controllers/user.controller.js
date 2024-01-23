import {asyncHandler} from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

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
    console.log("email: ", email);

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
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists ")
    }

    // check for avatar and cover image 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(files);

    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log(coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
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



export {registerUser}
