import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfully
    // console.log("File is Uploaded on Cloudinary !!", response.url);

    fs.unlinkSync(localFilePath); // removes the file path from mongondb server since the file is successfully saved on cloudinary 
    
    // console.log("response: ",response);

    return response;

  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temperary file as the uplaod operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
