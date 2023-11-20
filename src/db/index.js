import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Asynchronous function to connect to MongoDB
const connectDB = async () => {
  try {
    // Attempt to establish a connection to MongoDB using the provided URI and database name
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    // Log a success message with the connected MongoDB host information
    console.log(
      `\n MongoDB CONNECTED!!! DB_HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    // Log an error message if the MongoDB connection fails and exit the process
    console.log("MongoDB connection FAILED!!", error);
    process.exit(1);
  }
};

export default connectDB;
