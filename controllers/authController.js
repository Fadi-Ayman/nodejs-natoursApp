const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  user.password = undefined; // to not send the password in the response
  user.active = undefined;
  user.__v = undefined;

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    data: {
      token,
      user,
    },
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
    // role: req.body.role,
    role: 'user', // to avoid any security issues if the user send some unwanted fields in the request body like role admin.
  });

  // ~ Cannot send mails on prod.
  // const url = `${req.protocol}://${req.get('host')}/me`;
  // await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //^ 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  //^ 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // to not make request of user with requiered model fields

  //^ 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //^ 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //^ 2) if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // to run the validators and the pre save middleware to hash the password

  //^ 3) Update changedPasswordAt property for the user (using pre save middleware in userModel)

  //^ 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

// Middlewares

exports.protect = catchAsync(async (req, res, next) => {
  //^ 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );

  //^ 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // {
  //   id: '6a085c35f5293cf81496f4f4', // user id
  //   iat: 1779537404,  // issued at time
  //   exp: 1787313404 // expiration time
  // }

  //^ 3) Check if user still exists
  const userID = decoded.id;
  const currentUser = await User.findById(userID);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }
  //^ 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfterJWT(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  //^ 5) GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; // we can access the user in the next middlewares and controllers by req.user
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `You do not have permission to perform this action this action available only for ${roles.join(', ') || 'admin'}`,
          403,
        ),
      );
    }
    next();
  };
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  //^ 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');
  //^ 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  //^ 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //* to run the validators and the pre save middleware to hash the password (as they will not work on findByIdAndUpdate)
  await user.save();

  //^ 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

//~ SSR LOGIC

//~ ONly for rendered pages , no errors - SSR LOGIC
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //^ 1) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      //^ 2) Check if user still exists
      const userID = decoded.id;
      const currentUser = await User.findById(userID);
      if (!currentUser) {
        return next();
      }
      //^ 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfterJWT(decoded.iat)) {
        return next();
      }

      //^ 4) There is a logged in user -> to send the user data to the pug template (locals)
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//~  SSR LOGIC
exports.logout = catchAsync((req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});
