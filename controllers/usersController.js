const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const helperFactory = require('../utils/handlerFactory');
const multer = require('multer');
const sharp = require('sharp')

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   },
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if(!req.file) return next()

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)
  next()
})

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

// #### User Self Updates
exports.updateMe = catchAsync(async (req, res, next) => {
  //^ console.log(req.file)
  //   {
  //   fieldname: 'photo',
  //   originalname: '1.jpg',
  //   encoding: '7bit',
  //   mimetype: 'image/jpeg',
  //   path: 'public\\img\\users\\55cabff63a26e9b89228f695cb293de6',
  //   destination: 'public/img/users',
  //   filename: '55cabff63a26e9b89228f695cb293de6',
  //   size: 5485
  // }

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
  if (req.file) filteredBody.photo = req.file.filename;

  // 2) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
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
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// ###### Admin users CRUD operations

exports.getUsers = helperFactory.getAll(User, 'User', null, '*');
exports.getUser = helperFactory.getOne(User, 'User');
exports.createUser = helperFactory.createOne(User, 'User');
exports.updateUser = helperFactory.updateOne(User, 'User');
exports.deleteUser = helperFactory.deleteOne(User, 'User');
