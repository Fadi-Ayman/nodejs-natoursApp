const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.get('/:id', reviewController.getReviewById);
router
  .get('/', reviewController.getReviews)
  .get('/:id', reviewController.getReviewById)
  .post('/:tourId', authController.protect, reviewController.createReview);

module.exports = router;
