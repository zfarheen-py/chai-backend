import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";

// Define an asynchronous middleware to verify JWT tokens
export const verifyJWT = AsyncHandler(async (req, _, next) => {
  try {
    // Extract the JWT token from either the cookies or the Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // If no token is found, throw a 401 Unauthorized error
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Verify the JWT token using the ACCESS_TOKEN_SECRET from environment variables
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch the user from the database based on the decoded token's _id
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // If no user is found, throw a 401 Unauthorized error
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // Attach the user object to the request for later use in the route handler
    req.user = user;
  } catch (error) {
    // Handle errors during token verification and throw a 401 Unauthorized error
    throw new ApiError(401, error?.message || "Invalid access token");
  }
  // Move to the next middleware or route handler
  next();
});
