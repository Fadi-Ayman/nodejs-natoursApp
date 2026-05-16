const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");


const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};


exports.signup = catchAsync(async (req, res, next) => {
  //! const newUser = await User.create(req.body); 
   // this will work but we want to specify the fields that we want to create the user with to avoid any security issues if the user send some unwanted fields in the request body like role admin.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);

  

  res.status(201).json({
    status: "success",
    data: {
      token,
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const token = signToken(user._id);

  const userResponse = {
    name: user.name,
    email: user.email,
    photo: user.photo,
    role: user.role,
  };
  

  res.status(200).json({
    status: "success",
    data: {
      token,
      user: userResponse,
    },
  });
});