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
      enum: {
        values: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
        message: 'Rating must be between 1 and 5',
      },
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
    select: '_id name photo',
  });
  if(this.options.skipTourPopulate) return next();
  this.populate({
    path: 'tour',
    select:
    '_id name price ratingsQuantity ratingsAverage imageCover',
    options: { skipGuidesPopulate: true },
  })
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

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
