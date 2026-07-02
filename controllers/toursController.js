const Tour = require('../models/tourModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const helperFactory = require('../utils/handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage(); // because we will use that buffer from memory for sharp lib

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  console.log(req.files);

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
  next();
})

// making a middleware to set the query string for top 5 cheap tours (for alias route)
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// aggregation pipeline stages
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // match is the first stage where we match the documents like resource.find()
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    // group is calculations like a reduce method on arrays
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // that means that it grouped by difficulty in uppercase
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // sorting based on keys
    {
      $sort: { avgPrice: 1 }, // ascending order
      // $sort: { avgPrice: -1 } // descending order
    },
    // defines the shape of the output (0 hide || 1 show)
    {
      $project: {
        // _id: 0  // to remove the _id field from the output
        numTours: 1,
        numRatings: 1,
        avgRating: { $round: ['$avgRating', 1] },
        avgPrice: { $round: ['$avgPrice', 2] },
        minPrice: { $round: ['$minPrice', 2] },
        maxPrice: { $round: ['$maxPrice', 2] },
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestedTime,
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  if (Number.isNaN(year)) throw new Error('year must be a number');

  const plan = await Tour.aggregate([
    // 1st stage
    {
      // that will deconstruct the startDates array and make a document for each date in the array , as instead of have a document have 3 startsdates in array we will flatten them and got 3 documents withtout the starts array but with the startdates as string
      $unwind: '$startDates',
    },
    // 2nd stage
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    // 3rd stage
    {
      $group: {
        _id: { $month: '$startDates' }, // that means that it grouped by the month of the startDates
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, // that will push the name of the tour in an array in the tours field
      },
    },
    // 4th stage
    {
      $addFields: { month: '$_id' }, // that will add a new field month with the value of _id
    },
    // 5th stage
    {
      $project: {
        _id: 0,
      },
    },
    // 6th stage
    {
      $sort: { numTourStarts: -1 },
    },
    // 7th stage
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    requestedAt: req.requestedTime,
    data: {
      plan,
    },
  });
});

//^ geospatial queries from mongodb
// /tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // in radians

  if (!lat || !lng)
    return next(new AppError('Please provide lat and lng', 400));

  const tours =
    (await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    })) || [];

  res.status(200).json({
    status: 'success',
    results: tours.length,
    requestedAt: req.requestedTime,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    return next(new AppError('Please provide lat and lng', 400));

  const distances = await Tour.aggregate([
    {
      // geonear must me always first stage , and must at least have one of fields have geospatial index
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    requestedAt: req.requestedTime,
    data: {
      data: distances,
    },
  });
});

// Basic CRUD operations using factory functions
exports.getTours = helperFactory.getAll(
  Tour,
  'Tour',
  { path: 'reviews', select: 'review rating user -tour' },
  '*',
);
exports.getTour = helperFactory.getOne(Tour, 'Tour', { path: 'reviews' });
exports.createTour = helperFactory.createOne(Tour, 'Tour');
exports.updateTour = helperFactory.updateOne(Tour, 'Tour');
exports.deleteTour = helperFactory.deleteOne(Tour, 'Tour');
