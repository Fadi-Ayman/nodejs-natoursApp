
// For operational errors -- we should mark errors of mongodb as operational manually
// class AppError extends Error {
//   constructor(message, statusCode) {
//     super(message || 'An unexpected error occurred. Please try again later.');
//     this.statusCode = statusCode;
//     this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
//     this.isOperational = true; // to distinguish between operational errors and programming errors
//     Error.captureStackTrace(this, this.constructor);
//   }
// }

// module.exports = AppError;


class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message || 'An unexpected error occurred. Please try again later.');

    this.statusCode = statusCode;

    this.status = `${statusCode}`.startsWith('4')
      ? 'fail'
      : 'error';

    // optional detailed errors object
    this.errors = errors;

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;