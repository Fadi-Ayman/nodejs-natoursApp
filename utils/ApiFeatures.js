class ApiFeatures {
  constructor(query, queryString, model) {
    this.query = query;
    this.queryString = queryString;
    this.model = model;
  }

  filter() {
    const excludedFieldsOfQueryingDB = ['page', 'sort', 'limit', 'fields'];
    const comparisonOperatorsRegex = /\b(gte|gt|lte|lt)\b/g;

    const queryObj = { ...this.queryString };
    excludedFieldsOfQueryingDB.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      comparisonOperatorsRegex,
      (matched) => `$${matched}`,
    );

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.split(',').join(' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  async paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.sort('_id').skip(skip).limit(limit);
    if (!this.model) return this;

    if (this.queryString.page) {
      const numTours = await this.model.countDocuments();
      if (skip >= numTours)
        throw new Error(`this page does not exist max page is ${Math.ceil(numTours / limit) || 1}`);
    }

    return this;
  }
}

module.exports = ApiFeatures;

//! instead of making this we use api feature class
// async (req, res,next) => {
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

//     const tours = await features.query;

//     res.status(200).json({
//       status: 'success',
//       requestedAt: req.requestedTime,
//       results: tours.length,
//       data: {
//         tours
//       }
//     });
// }
