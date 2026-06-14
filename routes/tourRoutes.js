const express = require('express');
const toursController = require('../controllers/toursController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router(); // this is tourRouter

// this is a nested route to get the reviews of a specific tour ,ex /tours/:tourId/reviews
router.use('/:tourId/reviews', reviewRouter);

// alias route (we put it before the :id routes as it will be treated as a parameter if we put it after it)
router
  .route('/top-5-cheap')
  .get(toursController.aliasTopTours, toursController.getTours);

//get stats using aggrigation pipline stages
router.route('/tour-stats').get(toursController.getTourStats);

//get monthly plan
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    toursController.getMonthlyPlan,
  );

  router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursController.getToursWithin);

  router.route('/distances/:latlng/unit/:unit')
  .get(toursController.getDistances);

router
  .route('/')
  .get(toursController.getTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.createTour,
  );
router
  .route('/:id')
  .get(toursController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour,
  );

module.exports = router;
