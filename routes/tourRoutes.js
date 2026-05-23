const express = require('express');
const toursController = require('../controllers/toursController');
const authController = require('../controllers/authController');

const router = express.Router(); // this is tourRouter

// alias route (we put it before the :id routes as it will be treated as a parameter if we put it after it)
router
  .route('/top-5-cheap')
  .get(toursController.aliasTopTours, toursController.getAllTours);

//get stats using aggrigation pipline stages
router
  .route('/tour-stats')
  .get(toursController.getTourStats);

//get monthly plan
router
  .route('/monthly-plan/:year')
  .get(toursController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect,toursController.getAllTours)
  .post(toursController.createTour);
router
  .route('/:id')
  .get(toursController.getTourById)
  .patch(toursController.updateTour)
  .delete(toursController.deleteTour);

module.exports = router;
