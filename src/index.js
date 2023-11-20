import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

/* Configuring 'dotenv' package: 
Load environment variables from a file named ".env" in the "env" directory*/
dotenv.config({
  path: "./env",
});

/* Establish a connection to the MongoDB database: 
If the connection is successful, it returns a promise 
that resolves with the connection instance.*/
connectDB()
  .then(() => {
    // If the database connection is successful, start the Express server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    // If there is an error in the database connection, log the error
    console.log("MongoDB connection Failed!!!", err);
  });
