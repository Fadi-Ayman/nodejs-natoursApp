const express = require('express');
const usersControllers = require('../controllers/usersController');
const authControllers = require('../controllers/authController');

const router = express.Router();

// AUTHENTICATION ROUTES
router.post('/signup', authControllers.signup);
router.post('/login', authControllers.login);
router.post('/forgotPassword', authControllers.forgotPassword);
router.patch('/resetPassword/:token', authControllers.resetPassword);

// CRUD ROUTES
router
  .route('/')
  .get(usersControllers.getAllUsers)
  .post(usersControllers.createUser);
router
  .route('/:id')
  .get(usersControllers.getUserById)
  .put(usersControllers.editUser)
  .delete(usersControllers.deleteUser);

module.exports = router;
