const Review = require('../models/reviewModel');
const ApiFeatures = require('../utils/ApiFeatures');
const catchAsync = require('../utils/catchAsync');

exports.getReviews = catchAsync(async (req, res, next) => {
  let reviews;
  if (req.params.tourId) {
    reviews = await Review.find({ tour: req.params.tourId });
  } else {
    const features = new ApiFeatures(Review.find(), req.query, Review)
      .filter()
      .sort()
      .limitFields();

    await features.paginate();

    reviews = await features.query;
  }

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    page: req.query.page * 1 || 1,
    data: {
      reviews,
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
