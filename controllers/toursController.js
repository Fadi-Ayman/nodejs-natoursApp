const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/ApiFeatures');
const { unexpectedErrorMessage } = require('../utils/constants');

// making a middleware to set the query string for top 5 cheap tours (for alias route)
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    // //^ 1) Filtering (with query string)
    // //* 1A) removing excluded fields from the query object as we will not quiry it in the DB. (page,sort,limit,fields,...etc)
    // const queryObj = { ...req.query }; // shallow copy
    // console.log(queryObj)
    // excludedFieldsOfQueryingDB.forEach(el => delete queryObj[el]);

    // //* 1B) Advanced filtering (gte,gt,lte,lt) in query string by (adding $ before them)
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(
    //   comparisonOperatorsRegex,
    //   matched => `$${matched}`
    // );

    // // this return a query object that we can chain it with other methods like sort, limit, select,...etc
    // let query = Tour.find(JSON.parse(queryStr));

    // //^ 2) Sorting , if no sort , we will sort by createdAt in descending order
    // if (req.query.sort) {
    //   query = query.sort(req.query.sort.split(',').join(' ')); //. ?sort=price,rating
    // } else {
    //   query = query.sort('-createdAt'); // default sort
    // }

    // //^ 3) Fields Limiting (select) , if no fields we will return all fields
    // if (req.query.fields) {
    //   query = query.select(req.query.fields.split(',').join(' ')); // query.select('name price duration')
    // } else {
    //   // default return all fields except __v field , - before __v to exclude it from the result
    //   query = query.select('-__v');
    // }

    // //^ 4) Pagination
    // const page = req.query.page * 1 || 1; // default page is 1
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit; // to skip the previous pages results
    // query = query
    //   .sort('_id')
    //   .skip(skip)
    //   .limit(limit);
    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('this page does not exist');
    // }

    //~ EXCUTE THE QUERY (Make Class for all comments above to make it more reusable and clean code)
    const features = new ApiFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    console.log(req.query);
    const tours = await features.query;

    res.status(200).json({
      success: true,
      requestedAt: req.requestedTime,
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || unexpectedErrorMessage,
      errors: error.errors || undefined // all mongose Errors
    });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const { id } = req.params;
    const tour = await Tour.findById(id);
    res.status(200).json({
      success: true,
      data: {
        tour
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || unexpectedErrorMessage,
      errors: error.errors || undefined // all mongose Errors
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      success: true,
      data: {
        tour: newTour
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || unexpectedErrorMessage,
      errors: error.errors || undefined // all mongose Errors
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const updatedTour = await Tour.findByIdAndUpdate(id, body, {
      new: true, // returns the new updated document ,so we need to store it in updatedTour variable.
      runValidators: true // run the scheme validations in update as well as create. validite the body keys
    });

    res.status(200).json({
      success: true,
      data: {
        tour: updatedTour,
        insertionId: updatedTour.id
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || unexpectedErrorMessage,
      errors: error.errors || undefined // all mongoose Errors
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    await Tour.findByIdAndDelete(id);

    res.status(200 ).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || unexpectedErrorMessage,
      errors: error.errors || undefined // all mongose Errors
    });
  }
};

// aggregation pipeline stages
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      // match is the first stage where we match the documents like resource.find()
      {
        $match: { ratingsAverage: { $gte: 4.5 } }
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
          maxPrice: { $max: '$price' }
        }
      },
      // sorting based on keys
      {
        $sort: { avgPrice: 1 } // ascending order
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
          maxPrice: { $round: ['$maxPrice', 2] }
        }
      }
    ]);
    res.status(200).json({
      success: true,
      requestedAt: req.requestedTime,
      data: {
        stats
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || unexpectedErrorMessage,
      errors: error.errors || undefined // all mongose Errors
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    if (Number.isNaN(year)) throw new Error('year must be a number');

    const plan = await Tour.aggregate([
      // 1st stage
      {
        // that will deconstruct the startDates array and make a document for each date in the array , as instead of have a document have 3 startsdates in array we will flatten them and got 3 documents withtout the starts array but with the startdates as string
        $unwind: '$startDates' 
      },
      // 2nd stage
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        },
        },
      // 3rd stage
      {
        $group: {
          _id: { $month: '$startDates' }, // that means that it grouped by the month of the startDates
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' } // that will push the name of the tour in an array in the tours field
        }
      },
      // 4th stage
      {
        $addFields : { month: '$_id' } // that will add a new field month with the value of _id
      },
        // 5th stage
      {
        $project : {
          _id: 0 
        }
      },
        // 6th stage
      {
        $sort: { numTourStarts: -1 }
      },
        // 7th stage
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      success: true,
      results: plan.length,
      requestedAt: req.requestedTime,
      data: {
        plan
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || unexpectedErrorMessage,
      errors: error.errors || undefined // all mongose Errors
    });
  }
};
