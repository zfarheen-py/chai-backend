/* Define a higher-order function called AsyncHandler, 
which takes a requestHandler function as a parameter*/
const AsyncHandler = (requestHandler) => {
  // Return a new function that takes the standard Express.js middleware parameters: req, res, and next
  return (req, res, next) => {
    // Wrap the execution of the provided requestHandler in a Promise using Promise.resolve
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      // If an error occurs, pass it to the next middleware or error handler in the Express.js chain
      next(err);
    });
  };
};

export { AsyncHandler };
