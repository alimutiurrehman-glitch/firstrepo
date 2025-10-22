const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');
const { AppError, catchAsync } = require('../utils/errorHandler');

/**
 * Get all reviews for a movie
 * GET /api/movies/:id/reviews
 */
exports.getMovieReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Verify movie exists
  const movie = await Movie.findById(id);
  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  const skip = (page - 1) * limit;

  // Get reviews with user info
  const reviews = await Review.find({ movieId: id })
    .populate('userId', 'name email')
    .sort({ helpful: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await Review.countDocuments({ movieId: id });

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Create a new review
 * POST /api/movies/:id/reviews
 */
exports.createReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId, rating, reviewText } = req.body;

  // Verify movie exists
  const movie = await Movie.findById(id);
  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ userId, movieId: id });
  if (existingReview) {
    throw new AppError('You have already reviewed this movie', 400);
  }

  // Create review
  const review = await Review.create({
    userId,
    movieId: id,
    rating,
    reviewText
  });

  // Populate user info
  await review.populate('userId', 'name email');

  res.status(201).json({
    success: true,
    data: { review }
  });
});

/**
 * Get review statistics for a movie
 * GET /api/movies/:id/reviews/stats
 */
exports.getReviewStats = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Verify movie exists
  const movie = await Movie.findById(id);
  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  // Calculate stats
  const stats = await Review.aggregate([
    { $match: { movieId: movie._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratings: { $push: '$rating' }
      }
    }
  ]);

  // Calculate rating distribution
  let ratingDistribution = {
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
    '6': 0, '7': 0, '8': 0, '9': 0, '10': 0
  };

  if (stats.length > 0) {
    stats[0].ratings.forEach(rating => {
      ratingDistribution[rating.toString()] = (ratingDistribution[rating.toString()] || 0) + 1;
    });
  }

  res.status(200).json({
    success: true,
    data: {
      averageRating: stats[0]?.averageRating.toFixed(1) || 0,
      totalReviews: stats[0]?.totalReviews || 0,
      ratingDistribution
    }
  });
});

/**
 * Update review helpful count
 * PATCH /api/reviews/:id/helpful
 */
exports.markReviewHelpful = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findByIdAndUpdate(
    id,
    { $inc: { helpful: 1 } },
    { new: true }
  ).populate('userId', 'name email');

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { review }
  });
});

module.exports = exports;

