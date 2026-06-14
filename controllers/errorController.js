const AppError = require('../utils/AppError');

// const handleCastErrorDB = err => {
//   const message = `Invalid ${err.path}: ${err.value}.`;
//   return new AppError(message, 400);
// }

// const handleDuplicateFieldsDB = err => {
//   const value = Object.values(err.keyValue)[0];
//   const message = `Duplicate field value: ${value}. Please use another value!`;
//   return new AppError(message, 400);
// };

// const handleValidationErrorDB = err => {
//   const errors = Object.values(err.errors).map(el => el.message);
//   const message = `Invalid input data: ${errors.join(', ')}`;
//   return new AppError(message, 400);
// };

// const sendErrorDev = (err, res) => {
//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//     stack: err.stack,
//     error: err
//   });
// }

// const sendErrorProd = (err, res) => {
//   // Operational, trusted error: send message to client
//   if (err.isOperational) {
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message
//     })
//   }
//   // Programming or other unknown error: don't leak error details
//   else{
//     // log error - to see the logs in heroku platform, use heroku logs --tail
//     console.error('ERROR 💥', err);
//     // send generic message
//     res.status(500).json({
//       status: 'error',
//       message: 'somthing went wrong'
//     })
//   }}

// module.exports = (err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   if (process.env.NODE_ENV === 'development') {
//     sendErrorDev(err, res);
//   } else if (process.env.NODE_ENV === 'production') {
//     let error = { ...err };
//     if(err.name === 'CastError') error = handleCastErrorDB(error);
//     if(err.code === 11000) error = handleDuplicateFieldsDB(error);
//     if(err.name === 'ValidationError') error = handleValidationErrorDB(error);

//     sendErrorProd(error, res);
//   }
// }

const buildErrorsObject = (errorsArray) => {
  const errors = {};

  errorsArray.forEach((err) => {
    if (err.field) {
      errors[err.field] = err.message;
    }
  });

  // unified handling
  return Object.keys(errors).length ? errors : null;
};

const handleCastErrorDB = (err) => {
  // support future multiple cast errors
  const extractedErrors = [
    {
      field: err.path,
      message: `Invalid ${err.path}: ${err.value}.`,
    },
  ];

  const errors = buildErrorsObject(extractedErrors);

  return new AppError(Object.values(errors).join(', '), 400, errors);
};

const handleDuplicateFieldsDB = (err) => {
  // support multiple duplicate keys
  const extractedErrors = Object.entries(err.keyValue).map(
    ([field, value]) => ({
      field,
      message: `Duplicate field value: ${value}. Please use another value!`,
    }),
  );

  const errors = buildErrorsObject(extractedErrors);

  return new AppError(Object.values(errors).join(', '), 400, errors);
};

const handleValidationErrorDB = (err) => {
  const extractedErrors = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message,
  }));

  const errors = buildErrorsObject(extractedErrors);

  const message =
    Object.values(errors || {})[0] ||
    `Invalid input data: ${Object.values(err.errors)
      .map((el) => el.message)
      .join(', ')}`;

  return new AppError(message, 400, errors);
};

const handleJsonWebTokenError = () =>
  new AppError('Invalid token. Please log in again!', 401);
const handleTokenExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const handleBadValueError = (err) => {
  return new AppError(err.message, 400);
}

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    errors: err.errors ? err.errors : undefined,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors ? err.errors : undefined,
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    // log error - to see the logs in heroku platform, use heroku logs --tail
    console.error('ERROR 💥', err);

    // send generic message
    res.status(500).json({
      status: 'error',
      message: 'somthing went wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  let error = err;

  if (error.name === 'CastError')
    error = handleCastErrorDB(error);

  if (error.code === 11000)
    error = handleDuplicateFieldsDB(error);

  if (error.name === 'ValidationError')
    error = handleValidationErrorDB(error);

  if (error.name === 'JsonWebTokenError')
    error = handleJsonWebTokenError();

  if (error.name === 'TokenExpiredError')
    error = handleTokenExpiredError();

  if(error.codeName === "BadValue") {
    error = handleBadValueError(err);
  }

  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(error, res);
  }
};