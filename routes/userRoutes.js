const express = require('express');
const usersControllers = require('../controllers/usersController');
const authControllers = require('../controllers/authController');

const router = express.Router();

// AUTHENTICATION ROUTES
router.post('/signup', authControllers.signup);
router.post('/login', authControllers.login);
router.post('/forgotPassword', authControllers.forgotPassword);
router.patch('/resetPassword/:token', authControllers.resetPassword);

// PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
router.use(authControllers.protect);

router.patch(
  '/updatePassword',

  authControllers.updatePassword,
);
router.patch('/updateMe', usersControllers.updateMe);
router.delete('/deleteMe', usersControllers.deleteMe);
router.get('/me', usersControllers.getMe, usersControllers.getUser);

// ONLY ADMIN CAN ACCESS THE ROUTES AFTER THIS MIDDLEWARE
router.use(authControllers.restrictTo('admin'));

// CRUD ROUTES
router
  .route('/')
  .get(usersControllers.getUsers)
  .post(usersControllers.createUser);
router
  .route('/:id')
  .get(usersControllers.getUser)
  .put(usersControllers.updateUser)
  .delete(usersControllers.deleteUser);

module.exports = router;
