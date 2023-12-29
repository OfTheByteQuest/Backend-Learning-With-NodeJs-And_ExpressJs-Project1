import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//Configuring cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDIARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (localFilePath)
      return "pError:File path is not provided at uploadOnCloudinary FUNCTION -file- services/cloudinary.js";

    const response = await cloudinary.uploader.upload(localFilePath, {
      resourceType: auto,
    });

    console.log(
      "CloudUploadSuccess: File uploading at Clodinary is successfull through uploadOnCloudinary FUNCTION -file- services/cloudinary.js"
    );

    return response;
  } catch (error) {
    fs.unsign(localFilePath); //Removes file from the server althought the uploding process failed

    console.log(
      "CloudUploadError: File uploading failed at Clodinary through uploadOnCloudinary FUNCTION -file- services/cloudinary.js"
    );

    return "CloudUploadSuccess: File upload at Clodinary is successfull through uploadOnCloudinary FUNCTION -file- services/cloudinary.js";
  }
};
