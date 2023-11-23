import multer from "multer"; // Import the 'multer' middleware for handling file uploads

// Configure storage settings for multer
const storage = multer.diskStorage({
  // Specify the destination directory for uploaded files
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  // Specify the filename for uploaded files
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Create a multer instance with the configured storage settings
export const upload = multer({ storage });
