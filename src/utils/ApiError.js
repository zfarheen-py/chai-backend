// Define a custom error class named ApiError that extends the built-in Error class
class ApiError extends Error {
  // Constructor for the ApiError class
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    // Call the constructor of the parent class (Error) with the provided message
    super(message);
    // Set additional properties specific to the ApiError class
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // If a stack trace is provided, use it; otherwise, capture a new stack trace
    if (stack) {
      this.stack = stack;
    } else {
      // Capture a stack trace starting from the constructor call
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
