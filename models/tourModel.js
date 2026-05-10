const mongoose = require('mongoose');
const slugify = require('slugify')

//(1) Create mongo schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: [true, 'A tour with that name already exists'],
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [4, 'A tour name must have more or equal than 4 characters'],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
      min: [1, 'Price must be above 0']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
      min: [1, 'Duration must be above 0']
    },
    maxGroupSize: {
      type: Number, 
      required: [true, 'A tour must have a group size'],
      min: [1, 'Group size must be above 0']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'], 
        message: 'Difficulty is either: easy, medium, difficult'
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    priceDiscount: {
      type: Number
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // that make this not return in the response, need for sestive data like passwords
    },
    startDates: [Date],
    slug: String
  },
  // to include virtual properties in the output of the response
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual properties (not persisted in db but calculated on the fly), we (cannot use) this virtual propery in query because it is not a part of the document
tourSchema.virtual('durationWeeks').get(function() {
  return Number((this.duration / 7).toFixed(2)) || 0
});

//^ Document Middleware (pre,post): runs before .save() and .create() only...
// tourSchema.pre('save', function(next) {
//   this.slug = slugify(this.name, { lower: true });
//   next();
// });
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });



//(2) create model from schema (Model best practice to be capitalized)
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
