import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = AsyncHandler(async (req, res) => {
  // Testing code:
  // res.status(200).json({
  //   message: "zfarheen.py",
  // });
  //
  /* Steps for user register:
      - get user details from frontend
      - validation- not empty
      - check if user already exists: username, email
      - check for images, check for avatar
      - upload them to cloudinary, avatar
      - create user object - create entry in db
      - remove password and refresh token field from response
      - check for user creation
      - return response
  */

  // Destructure relevant fields from the request body
  const { fullName, email, username, password } = req.body;
  console.log("email:", email);

  // if (fullName === "") {
  //   throw new ApiError(400, "FullName is required!")
  // }  OR

  // Check if any required fields are empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  // Check if a user with the same email or username already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists.");
  }

  // Extract local paths for avatar and cover image files from the request
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  
  // Handling "cannot read properties of undefined" error when field is empty using classic method:
  let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

  // console.log(req.files);

  // Check if the avatar file exists
  if (!avatarLocalPath) {
    console.error("Avatar file does not exist at", avatarLocalPath);
    throw new ApiError(400, "Avatar file is required.");
  }

  // Upload avatar and cover image files to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Check if avatar file uploaded successfully
  if (!avatar) {
    console.log("Avatar file didn't upload on cloudinary:", avatar);
    throw new ApiError(400, "Avatar file is required.");
  }

  // Create a new user in the database with the provided information
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // Fetch the created user from the database, excluding sensitive information
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // "-" means "doesn't need"
  );

  // Handle errors during user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  // Return a success response with the created user details
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully."));
});

export { registerUser };
