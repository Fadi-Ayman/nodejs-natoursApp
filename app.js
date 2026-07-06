const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const helmetConfig = require('./utils/helmetConfig');
const compression = require('compression');

const app = express();

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');
const viewRoutes = require('./routes/viewRoutes');

//~ Define the view engine - SSR Logic
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// ~ End SSR Logic


const limiter = rateLimit({
  max: 100, // max number of requests from the same IP
  windowMs: 60 * 60 * 1000, // per hour
  handler: (req, res, next) => {
    return next(
      new AppError(
        'Too many requests from this IP, please try again in an hour!',
        429,
      ),
    );
  },
});

// GLOBAL MIDDLEWARES

// security headers
// app.use(helmet());
app.use(helmet(helmetConfig));
// logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// rate limiting
app.use('/api', limiter);

// get body for post request. (body parser)
app.use(express.json({ limit: '10kb' })); // limit the size of the body to

// get body for post request of form sumbittion in html or template. (body parser)
app.use(express.urlencoded({ extended: true, limit: '10kb' })); 

// cookie parser
app.use(cookieParser());

// data sanitization against NoSQL query injection //! to prevent for example { "email": { "$gt": "" }, "password": "pass1234" }
app.use(mongoSanitize());

// data sanitization against XSS //! to prevent html from injecting in the input fields and then executing it in the browser
app.use(xss());

// prevent parameter pollution //! to prevent for example ?sort=price&sort=duration which will cause problem in the sorting
app.use(
  hpp({
    // whitelist of parameters that are allowed to have duplicate values in the query string
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(compression()); // compress all the text sent to the client (html, css, js, json, etc..)

// middleWare To Minuplate Request object and add to it requestTime
app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  next();
});


// ^ Routes
// Website Routes
app.use('/', viewRoutes);
// API Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// for unhandled routes instead of sending html
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
