// Define a class named ApiResponse to represent the structure of API responses
class ApiResponse {
  // Constructor for the ApiResponse class
  constructor(statusCode, data, message = "Success") {
    // Set properties based on the provided parameters
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
