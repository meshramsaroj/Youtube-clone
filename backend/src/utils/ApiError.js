class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    stack = "",
    errors = []
  ) {
    super(message); // it will definately override message
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.status = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
