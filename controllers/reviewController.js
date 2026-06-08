const Review = require('../models/reviewModel');
const ApiFeatures = require('../utils/ApiFeatures');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getReviews = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Review.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const reviews = await features.query;
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.getReviewById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) {
    return next(new AppError(`No review found with id: ${id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const user = req.user._id;
  const tour = req.params.tourId;
  const review = await Review.create({
    review: req.body.review,
    rating: req.body.rating,
    tour,
    user,
  });
  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});