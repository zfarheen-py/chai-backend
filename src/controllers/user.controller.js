import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // Fetch the user from the database based on the provided userId
    const user = await User.findById(userId);

    // Generate an access token for the user using a custom method
    const accessToken = user.generateAccessToken();

    // Generate a refresh token for the user using a custom method
    const refreshToken = user.generateRefreshToken();

    // Update the user's refreshToken in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Return an object containing the generated access and refresh tokens
    return { accessToken, refreshToken };
  } catch (error) {
    // Handle errors during token generation and throw a 500 Internal Server Error
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
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

const loginUser = AsyncHandler(async (req, res) => {
  // req.body -> data
  // username or email
  // find the user
  // password check
  // access & refresh token (generate & to be sent to user in the form of cookie)
  // send cookie

  // Destructure email, username, and password from the request body
  const { email, username, password } = req.body;
  console.log(email);

  // Check if either username or email is provided, as one of them is required for authentication
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Alternative check using logical OR operator to achieve the same result
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")
  // }

  // Find a user in the database based on the provided username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // If no user is found, throw a 404 error
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check if the provided password is correct for the found user
  const isPasswordValid = await user.isPasswordCorrect(password);

  // If the password is not valid, throw a 401 error indicating invalid credentials
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate access and refresh tokens for the authenticated user
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Fetch the logged-in user from the database, excluding sensitive information
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Configure options for HTTP-only secure cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Return a success response with cookies containing access and refresh tokens
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In successfully"
      )
    );
});

const logoutUser = AsyncHandler(async (req, res) => {
  // Update the user document to set the refreshToken to undefined
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  // Configure options for HTTP-only secure cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Return a success response with cleared access and refresh tokens cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = AsyncHandler(async (req, res) => {
  // Extract the refresh token from cookies or request body
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // If no refresh token is provided, throw a 401 Unauthorized error
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    // Verify the incoming refresh token using the REFRESH_TOKEN_SECRET from environment variables
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Fetch the user from the database based on the decoded token's _id
    const user = await User.findById(decodedToken?._id);

    // If no user is found, throw a 401 Unauthorized error
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Check if the incoming refresh token matches the stored refresh token for the user
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Configure options for HTTP-only secure cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    // Generate a new access token and refresh token for the user
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // Return a success response with updated cookies containing the new access and refresh tokens
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    // Handle errors during token verification and throw a 401 Unauthorized error
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
