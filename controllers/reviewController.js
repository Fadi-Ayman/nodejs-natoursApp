const Review = require('../models/reviewModel');
const helperFactory = require('../utils/handlerFactory');

// MiddleWare for set tour and user ids to use normal factory function on in instead of make a separate handler for that.
exports.setTourUserIdsForCreateReview = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getReviews = helperFactory.getAll(Review,'Review',undefined,'*','tour');
exports.getReview = helperFactory.getOne(Review, 'Review');
exports.createReview = helperFactory.createOne(Review, 'Review');
exports.updateReview = helperFactory.updateOne(Review, 'Review');
exports.deleteReview = helperFactory.deleteOne(Review, 'Review');
