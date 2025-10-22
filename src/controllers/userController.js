const User = require('../models/User');
const WatchHistory = require('../models/WatchHistory');
const { AppError, catchAsync } = require('../utils/errorHandler');

/**
 * Get all users
 * GET /api/users
 */
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-__v').lean();

  res.status(200).json({
    success: true,
    data: { users }
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

/**
 * Add movie to user's watch history with optional review
 * POST /api/users/:id/watch
 */
exports.addToWatchHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { movieId, watchDuration, completionPercentage, rating, reviewText } = req.body;

  // Validate required fields
  if (!movieId) {
    throw new AppError('Movie ID is required', 400);
  }

  // Verify user exists
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify movie exists
  const Movie = require('../models/Movie');
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  // Create watch history entry
  const watchHistory = new WatchHistory({
    userId: id,
    movieId: movieId,
    watchDuration: watchDuration || 0,
    completionPercentage: completionPercentage || 0
  });

  await watchHistory.save();

  let review = null;
  
  // Create review if rating is provided
  if (rating) {
    const Review = require('../models/Review');
    
    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({ userId: id, movieId: movieId });
    
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      if (reviewText) existingReview.reviewText = reviewText;
      await existingReview.save();
      review = existingReview;
    } else {
      // Create new review
      review = new Review({
        userId: id,
        movieId: movieId,
        rating: rating,
        reviewText: reviewText || ''
      });
      await review.save();
    }
  }

  res.status(201).json({
    success: true,
    data: {
      watchHistory,
      review,
      message: 'Movie added to watch history successfully' + (review ? ' with review' : '')
    }
  });
});

/**
 * Get user watch history
 * GET /api/users/:id/history
 */
exports.getUserHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, page = 1, limit = 20 } = req.query;

  // Verify user exists
  const user = await User.findById(id).lean();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Build filter
  const filter = { userId: id };
  
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  // Get paginated history
  const skip = (page - 1) * limit;
  
  const history = await WatchHistory.find(filter)
    .populate('movieId', 'title posterUrl rating genres releaseYear')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await WatchHistory.countDocuments(filter);

  // Calculate statistics
  const stats = await WatchHistory.aggregate([
    { $match: { userId: user._id } },
    {
      $lookup: {
        from: 'movies',
        localField: 'movieId',
        foreignField: '_id',
        as: 'movie'
      }
    },
    { $unwind: '$movie' },
    {
      $group: {
        _id: null,
        totalMoviesWatched: { $sum: 1 },
        totalWatchTime: { $sum: '$watchDuration' },
        genres: { $push: '$movie.genres' }
      }
    }
  ]);

  // Find favorite genre - improved calculation
  let favoriteGenre = 'N/A';
  if (stats.length > 0 && stats[0].genres) {
    const genreCount = {};
    
    // Flatten all genres and count them
    stats[0].genres.forEach(movieGenres => {
      if (Array.isArray(movieGenres)) {
        movieGenres.forEach(genre => {
          if (genre && genre.trim()) {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          }
        });
      }
    });
    
    // Find the most watched genre
    if (Object.keys(genreCount).length > 0) {
      favoriteGenre = Object.keys(genreCount).reduce((a, b) => 
        genreCount[a] > genreCount[b] ? a : b
      );
    }
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionType: user.subscriptionType
      },
      history: history.map(h => ({
        movie: h.movieId,
        watchedAt: h.timestamp,
        duration: h.watchDuration,
        completionPercentage: h.completionPercentage
      })),
      stats: {
        totalMoviesWatched: stats[0]?.totalMoviesWatched || 0,
        totalWatchTime: stats[0]?.totalWatchTime || 0,
        favoriteGenre
      },
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
 * Create new user
 * POST /api/users
 */
exports.createUser = catchAsync(async (req, res) => {
  const { name, email, subscriptionType } = req.body;

  const user = await User.create({
    name,
    email,
    subscriptionType
  });

  res.status(201).json({
    success: true,
    data: { user }
  });
});

module.exports = exports;

