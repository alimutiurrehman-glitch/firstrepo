const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { validators, validate } = require('../utils/validators');

// Get reviews for a movie
router.get('/movies/:id/reviews', validators.objectId('id'), validate, reviewController.getMovieReviews);

// Create review for a movie
router.post('/movies/:id/reviews', validators.objectId('id'), validators.createReview, validate, reviewController.createReview);

// Get review stats for a movie
router.get('/movies/:id/reviews/stats', validators.objectId('id'), validate, reviewController.getReviewStats);

// Mark review as helpful
router.patch('/reviews/:id/helpful', validators.objectId('id'), validate, reviewController.markReviewHelpful);

module.exports = router;

