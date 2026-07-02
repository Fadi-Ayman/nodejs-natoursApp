const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      required: [true, 'Rating can not be empty!'],
      default: 2.5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Remove __v from any response
reviewSchema.pre(/^find/, function (next) {
  this.select('-__v');
  next();
});

// remove id of virtual from schema , if there is a virtuals
reviewSchema.set('id', false);

//* that to populate the guides field with the data of the guides instead of just the ids
//* populate make another query to the db
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '_id name photo email',
  });
  if (this.options.skipTourPopulate) return next();
  this.populate({
    path: 'tour',
    select: '_id name price ratingsQuantity ratingsAverage imageCover',
    options: { skipGuidesPopulate: true },
  });
  next();
});

// if the user make a review for certain tour cannot make other review
reviewSchema.pre('save', async function (next) {
  const review = await this.constructor.findOne({
    tour: this.tour,
    user: this.user,
  });
  if (review) {
    return next(
      new AppError('You have already made a review for this tour', 400),
    );
  }
  next();
});

// if the user make a review for certain tour cannot make other review
//  the diff between statics and methods is that statics are available on the model and methods are available on the document only (instance)
reviewSchema.statics.calculateAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await this.model('Tour').findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calculateAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // before excute delete or update query, we got the document and store it in r to use it in post
  const r = await this.clone().findOne();
  if (!r) return next(new AppError('No document found', 404));
  this.r = r;
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calculateAverageRatings(this.r.tour._id);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
