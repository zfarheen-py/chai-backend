import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// Create an instance of the Express application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS) middleware with specified options
app.use(
  cors({
    // Set the allowed origin to the value specified in the environment variable CORS_ORIGIN
    origin: process.env.CORS_ORIGIN,
    // Allow credentials to be included in cross-origin requests
    credentials: true,
  })
);

// Parse incoming JSON requests and limit their size to 16 kilobytes
app.use(express.json({ limit: "16kb" }));
// Parse incoming URL-encoded data with extended support and limit its size to 16 kilobytes
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// Serve static files from the "public" directory
app.use(express.static("public"));
// Parse cookies in incoming requests
app.use(cookieParser());

// Routes import
import userRouter from "./routes/user.routes.js";

// Routes declaration
app.use("/api/v1/users", userRouter);

export { app };
