const express = require('express');
const morgan = require('morgan');

const app = express();

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// MIDDLEWARES
app.use(morgan('dev'));
// middleware for get body for post request.
app.use(express.json());
app.use(express.static(`${__dirname}/public`));
// middleWare To Minuplate Request object and add to it requestTime
app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  next();
});

// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
