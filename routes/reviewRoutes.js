const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // megreParams is used to have access to the params of the parent router (tourId in this case) in the reviewController

router
  .route('/')
  .get(reviewController.getReviews)
  .post(authController.protect, authController.restrictTo('user'),reviewController.createReview);

module.exports = router;
