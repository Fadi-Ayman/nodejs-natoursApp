const User = require('../models/userModel');
const ApiFeatures = require('../utils/ApiFeatures');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

// #### User Self Updates
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword.',
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');

  // 2) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// ###### Admin users CRUD operations

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const mainQuery = User.find();
  const features = new ApiFeatures(mainQuery, req.query, User)
    .filter()
    .sort()
    .limitFields();

  await features.paginate();

  const users = await features.query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    page: req.query.page * 1 || 1,
    data: {
      users,
    },
  });
});

exports.getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError(`No user found with id: ${id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.editUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'route is not defiend yet',
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'route is not defiend yet',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'route is not defiend yet',
  });
};
