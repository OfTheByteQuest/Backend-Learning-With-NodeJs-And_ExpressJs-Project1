import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//Configuring cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return "pError:File path is not provided at uploadOnCloudinary FUNCTION -file- services/cloudinary.js";
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log(
      "CloudUploadSuccess: File uploading at Clodinary is successfull through uploadOnCloudinary FUNCTION -file- services/cloudinary.js"
    );

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //Removes file from the server althought the uploding process failed

    console.log(
      "CloudUploadError: File uploading failed at Clodinary through uploadOnCloudinary FUNCTION -file- services/cloudinary.js"
    );

    return "CloudUploadError: File uploading failed at Clodinary through uploadOnCloudinary FUNCTION -file- services/cloudinary.js";
  }
};

const deleteFromCloudinary = async (public_id, resourceType = "image") => {
  try {
    if (public_id) {
      const response = await cloudinary.uploader.destroy(public_id, {
        invalidate: true,
        resource_type: resourceType,
      });

      return response.result;
    }
  } catch (error) {
    return error.message;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };