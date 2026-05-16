const express = require('express');
const usersControllers = require('../controllers/usersController');
const authControllers = require('../controllers/authController');


const router = express.Router();


router.post('/signup', authControllers.signup);
router.post('/login', authControllers.login);

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
