import { v2 as cloudinary } from "cloudinary"; // Import the Cloudinary library with alias 'v2'
import fs from "fs"; // Import the 'fs' module for file system operations

// Configure Cloudinary with API credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Check if a local file path is provided
    if (!localFilePath) return null;

    // Upload the file to Cloudinary using the 'uploader.upload' method
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Log success message and return Cloudinary response
    console.log("File is uploaded on CLoudinary", response.url);
    fs.unlinkSync(localFilePath)
    // return the response to user
    return response;
  } catch (error) {
    // If an error occurs, delete the locally saved temporary file and return null
    fs.unlinkSync(localFilePath);
    console.log("Error uploading the file", error)
    return null;
  }
};

export { uploadOnCloudinary };
