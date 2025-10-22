const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to check results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Common validation rules
const validators = {
  // MongoDB ObjectId validation
  objectId: (field) => param(field).isMongoId().withMessage('Invalid ID format'),

  // Review validation
  createReview: [
    body('userId').isMongoId().withMessage('Valid user ID required'),
    body('rating').isInt({ min: 1, max: 10 }).withMessage('Rating must be between 1-10'),
    body('reviewText').optional().trim().isLength({ max: 1000 }).withMessage('Review text max 1000 characters')
  ],

  // Search validation
  searchMovies: [
    query('query').optional().trim().isLength({ min: 1 }).withMessage('Search query required'),
    query('minRating').optional().isFloat({ min: 0, max: 10 }).withMessage('Min rating must be 0-10'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ]
};

module.exports = { validate, validators };

