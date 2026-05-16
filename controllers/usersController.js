const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');


exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});


exports.getUserById = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'route is not defiend yet'
  });
};

exports.editUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'route is not defiend yet'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'route is not defiend yet'
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'route is not defiend yet'
  });
};
