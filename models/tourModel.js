const mongoose = require('mongoose');
// const User = require('./userModel');
// const validator = require('validator');

//(1) Create mongo schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [4, 'A tour name must have more or equal than 4 characters'],
      // validate : [validator.isAlpha, 'Tour name must only contain characters']
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
      min: [1, 'Price must be above 0'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
      min: [1, 'Duration must be above 0'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
      min: [1, 'Group size must be above 0'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      // Validators Works only on CREATE and SAVE
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // that make this not return in the response, need for sestive data like passwords
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false }, // for test query middleware and aggregation middleware
    // slug: String, // for test document middleware
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  // to include virtual properties in the output of the response
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Remove __v from any response
tourSchema.pre(/^find/, function (next) {
  this.select('-__v');
  next();
});

// remove id of virtual from schema , if there is a virtuals
tourSchema.set('id', false);

//^ virtual properties (not persisted in db but calculated on the fly), we (cannot use) this virtual propery in query because it is not a part of the document

tourSchema.virtual('durationWeeks').get(function () {
  return Number((this.duration / 7).toFixed(2)) || 0;
});

// virtual populate to populate the reviews of the tour without store the reviews in the tour document and without make another query to the db because it will be populated when we get the tour document and it is not a part of the tour document but it is a virtual property that will be calculated on the fly when we get the tour document
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
  options: { skipTourPopulate: true }, // to remove the guides from res
});

//~ DB MIDDLEWARES ~

//^ 1) Document Middlewares (pre,post): runs  or after .save() and .create() only...

//* embedding the guides in the tour document -- but no need for it because better to use referencing because the guides can be updated and we dont want to update the tour document every time we update the guide document
// tourSchema.pre('save', async function (next) {
// const guidesPromises = this.guides.map(async id => await User.findById(id));
// this.guides = await Promise.all(guidesPromises);
// next();
// })

//^ 2) Query Middleware (pre,post): runs before or after .find() , .findOne() , .findById() , .findOneAndUpdate() , .findOneAndDelete() because we use regex starts with find...
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

//* that to populate the guides field with the data of the guides instead of just the ids
//* populate make another query to the db
tourSchema.pre(/^find/, function (next) {
  // in the populate of reviews we add (options: { skipGuidesPopulate: true }) to remove the guides from res
  if (this.options.skipGuidesPopulate) return next();

  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

//^ 3) Aggregation Middleware (pre,post): runs before or after .aggregate()
tourSchema.pre('aggregate', function (next) {
  // this.pipline return the array of aggregation pipline stages
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

//(2) create model from schema (Model best practice to be capitalized)
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
