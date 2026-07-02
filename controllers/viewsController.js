const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

exports.getOverView = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getSignupForm = catchAsync(async (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Create your account',
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  const user = await User.findById(currentUser._id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).render('account', {
    title: `${user.name} account`,
    user,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  const user = await User.findByIdAndUpdate(
    currentUser._id,
    { name: req.body.name, email: req.body.email },
    { new: true, runValidators: true, useFindAndModify: false },
  );

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).render('account', {
    title: `${user.name} account`,
    user,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user._id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
