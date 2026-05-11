const express = require('express');
const morgan = require('morgan');

const app = express();

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

// MIDDLEWARES
// middleware for logging
if(process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// middleware for get body for post request.
app.use(express.json());
// middleware for static files
app.use(express.static(`${__dirname}/public`));
// middleWare To Minuplate Request object and add to it requestTime
app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  next();
});


// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);


// for unhandled routes instead of sending html
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
