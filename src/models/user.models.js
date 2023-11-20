import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // to make any field searchable in an optimized way
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to hash the password before saving the user
userSchema.pre("save", async function (next) {
  // Check if the password field is modified; if not, proceed to the next middleware
  if (!this.isModified("password")) return next();

  // Hash the password using bcrypt with a cost factor of 10
  this.password = bcrypt.hash(this.password, 10);
  next();
});

// Method to check if the provided password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  // Compare the provided password with the hashed password stored in the user document
  return await bcrypt.compare(password, this.password);
};

// Method to generate an access token for user authentication
userSchema.methods.generateAccessToken = function () {
  // Sign a JSON Web Token (JWT) with user information and a secret key for access
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Method to generate a refresh token for user authentication
userSchema.methods.generateRefreshToken = function () {
  // Sign a JSON Web Token (JWT) with user information and a secret key for refresh
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
