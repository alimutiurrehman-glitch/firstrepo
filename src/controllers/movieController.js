const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const WatchHistory = require('../models/WatchHistory');
const Review = require('../models/Review');
const { AppError, catchAsync } = require('../utils/errorHandler');
const { calculateHybridScore, filterByGenre, filterByRating, paginate } = require('../services/searchService');

/**
 * Search movies with hybrid ranking
 * GET /api/movies/search
 */
exports.searchMovies = catchAsync(async (req, res) => {
  const { query, genre, minRating, page = 1, limit = 10, userId } = req.query;

  if (!query) {
    throw new AppError('Search query is required', 400);
  }

  // Get user's favorite genre if userId is provided
  let userFavoriteGenre = null;
  if (userId) {
    const userStats = await WatchHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'movies',
          localField: 'movieId',
          foreignField: '_id',
          as: 'movie'
        }
      },
      { $unwind: '$movie' },
      { $unwind: '$movie.genres' },
      {
        $group: {
          _id: '$movie.genres',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (userStats.length > 0) {
      userFavoriteGenre = userStats[0]._id;
    }
  }

  // Build search query with filters integrated - OPTIMIZED for speed
  const searchQuery = {
    $or: [
      { title: new RegExp(query, 'i') },
      { director: new RegExp(query, 'i') },
      { 'cast.name': new RegExp(query, 'i') }
    ]
  };

  // Add genre filter if specified
  if (genre) {
    searchQuery.genres = new RegExp(genre, 'i');
  }

  // Add rating filter if specified
  if (minRating) {
    searchQuery.rating = { $gte: parseFloat(minRating) };
  }

  // Perform search with LIMIT to improve speed - only get top 100 matches
  let movies = await Movie.find(searchQuery)
    .limit(100)
    .lean();

  // Define queryLower for use in sorting and highlighting
  const queryLower = query.toLowerCase();

  // Calculate hybrid scores for each movie first
  const weights = {
    similarity: 0.5,
    rating: 0.3,
    popularity: 0.2
  };

  const moviesWithScores = movies.map(movie => {
    const scores = calculateHybridScore(movie, query, weights);
    return {
      ...movie,
      hybridScore: scores.finalScore,
      scoreBreakdown: {
        text: scores.textScore.toFixed(2),
        rating: scores.ratingScore.toFixed(2),
        popularity: scores.popularityScore.toFixed(2)
      }
    };
  });

  // Sort by relevance: user's favorite genre, title starts with query, title contains query, director, cast, then hybrid score
  moviesWithScores.sort((a, b) => {
    
    // Check for user's favorite genre match
    const aFavoriteGenre = userFavoriteGenre && a.genres && a.genres.includes(userFavoriteGenre);
    const bFavoriteGenre = userFavoriteGenre && b.genres && b.genres.includes(userFavoriteGenre);
    
    // Check for title starting with query
    const aTitleStarts = a.title.toLowerCase().startsWith(queryLower);
    const bTitleStarts = b.title.toLowerCase().startsWith(queryLower);
    
    // Check for title containing query
    const aTitleContains = a.title.toLowerCase().includes(queryLower);
    const bTitleContains = b.title.toLowerCase().includes(queryLower);
    
    // Check for director matches
    const aDirectorMatch = a.director && a.director.toLowerCase().includes(queryLower);
    const bDirectorMatch = b.director && b.director.toLowerCase().includes(queryLower);
    
    // Priority 1: User's favorite genre + title starts with query
    if (aFavoriteGenre && aTitleStarts && !(bFavoriteGenre && bTitleStarts)) return -1;
    if (bFavoriteGenre && bTitleStarts && !(aFavoriteGenre && aTitleStarts)) return 1;
    
    // Priority 2: User's favorite genre + title contains query
    if (aFavoriteGenre && aTitleContains && !(bFavoriteGenre && bTitleContains)) return -1;
    if (bFavoriteGenre && bTitleContains && !(aFavoriteGenre && aTitleContains)) return 1;
    
    // Priority 3: User's favorite genre (any text match)
    if (aFavoriteGenre && !bFavoriteGenre) return -1;
    if (bFavoriteGenre && !aFavoriteGenre) return 1;
    
    // Priority 4: Title starts with query
    if (aTitleStarts && !bTitleStarts) return -1;
    if (!aTitleStarts && bTitleStarts) return 1;
    
    // Priority 5: Title contains query (but doesn't start with it)
    if (aTitleContains && !bTitleContains) return -1;
    if (!aTitleContains && bTitleContains) return 1;
    
    // Priority 6: Director matches
    if (aDirectorMatch && !bDirectorMatch) return -1;
    if (!aDirectorMatch && bDirectorMatch) return 1;
    
    // Priority 7: Hybrid score
    return b.hybridScore - a.hybridScore;
  });

  // Add highlighting to show what matched
  const moviesWithHighlights = moviesWithScores.map(movie => {
    const highlightedMovie = { ...movie };
    
    // Highlight title matches
    if (movie.title.toLowerCase().includes(queryLower)) {
      highlightedMovie.titleHighlighted = highlightText(movie.title, query);
    }
    
    // Highlight director matches
    if (movie.director && movie.director.toLowerCase().includes(queryLower)) {
      highlightedMovie.directorHighlighted = highlightText(movie.director, query);
    }
    
    // Highlight cast matches
    if (movie.cast && movie.cast.length > 0) {
      highlightedMovie.castHighlighted = movie.cast.map(cast => {
        if (cast.name && cast.name.toLowerCase().includes(queryLower)) {
          return {
            ...cast,
            nameHighlighted: highlightText(cast.name, query)
          };
        }
        return cast;
      });
    }
    
    return highlightedMovie;
  });

  // Apply pagination
  const result = paginate(moviesWithHighlights, page, limit);

  res.status(200).json({
    success: true,
    data: {
      movies: result.data,
      pagination: result.pagination,
      userFavoriteGenre: userFavoriteGenre,
      personalized: userId ? true : false
    }
  });
});

/**
 * Get personalized trending movies based on user's favorite genre
 * GET /api/movies/trending?userId=...
 */
exports.getTrendingMovies = catchAsync(async (req, res) => {
  const { userId } = req.query;
  // Expand time range to get more movies (last 90 days instead of 30)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Get user's favorite genre if userId is provided
  let userFavoriteGenre = null;
  let userWatchedMovies = [];
  
  if (userId) {
    // Get user's favorite genre
    const userStats = await WatchHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'movies',
          localField: 'movieId',
          foreignField: '_id',
          as: 'movie'
        }
      },
      { $unwind: '$movie' },
      { $unwind: '$movie.genres' },
      {
        $group: {
          _id: '$movie.genres',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    if (userStats.length > 0) {
      userFavoriteGenre = userStats[0]._id;
    }

    // Get movies already watched by user
    const watchedMovies = await WatchHistory.find({ userId: new mongoose.Types.ObjectId(userId) })
      .select('movieId')
      .lean();
    
    userWatchedMovies = watchedMovies.map(w => w.movieId.toString());
  }

  // Build aggregation pipeline
  const pipeline = [
    // Stage 1: Filter last 90 days for more variety
    {
      $match: {
        timestamp: { $gte: ninetyDaysAgo }
      }
    },
    // Stage 2: Group by movie and calculate stats
    {
      $group: {
        _id: '$movieId',
        watchCount: { $sum: 1 },
        totalDuration: { $sum: '$watchDuration' },
        uniqueViewers: { $addToSet: '$userId' }
      }
    },
    // Stage 3: Lookup movie details
    {
      $lookup: {
        from: 'movies',
        localField: '_id',
        foreignField: '_id',
        as: 'movie'
      }
    },
    // Stage 4: Unwind movie array
    { $unwind: '$movie' },
    // Stage 5: Add genre match score and filter out watched movies
    {
      $addFields: {
        genreMatch: {
          $cond: {
            if: { $and: [userFavoriteGenre, { $in: [userFavoriteGenre, '$movie.genres'] }] },
            then: 1,
            else: 0
          }
        },
        isWatchedByUser: {
          $cond: {
            if: { $in: [{ $toString: '$_id' }, userWatchedMovies] },
            then: 1,
            else: 0
          }
        }
      }
    }
  ];

  // Add filter for watched movies only if user is provided and we have enough unwatched movies
  // We'll handle this differently to ensure we always get 5 movies

  // Add remaining stages
  pipeline.push(
    // Project fields
    {
      $project: {
        _id: '$movie._id',
        title: '$movie.title',
        posterUrl: '$movie.posterUrl',
        rating: '$movie.rating',
        genres: '$movie.genres',
        releaseYear: '$movie.releaseYear',
        watchCount: 1,
        uniqueViewers: { $size: '$uniqueViewers' },
        avgWatchTime: { 
          $round: [{ $divide: ['$totalDuration', '$watchCount'] }, 0] 
        },
        genreMatch: 1
      }
    },
    // Sort by genre match first, then unwatched movies, then watch count
    { 
      $sort: { 
        genreMatch: -1,
        isWatchedByUser: 1,  // 0 (unwatched) comes before 1 (watched)
        watchCount: -1 
      } 
    },
    // Limit to top 20 for better variety
    { $limit: 20 }
  );

  const trending = await WatchHistory.aggregate(pipeline);

  res.status(200).json({
    success: true,
    data: {
      trending,
      period: 'Last 90 days',
      personalized: userId ? true : false,
      userFavoriteGenre: userFavoriteGenre,
      filteredOutWatched: userWatchedMovies.length
    }
  });
});

/**
 * Get movie by ID with reviews
 * GET /api/movies/:id
 */
exports.getMovieById = catchAsync(async (req, res) => {
  const movie = await Movie.findById(req.params.id).lean();

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  // Get average rating from reviews
  const reviewStats = await Review.aggregate([
    { $match: { movieId: movie._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  movie.reviewStats = reviewStats[0] || { averageRating: 0, totalReviews: 0 };

  res.status(200).json({
    success: true,
    data: { movie }
  });
});

/**
 * Get all movies (with pagination)
 * GET /api/movies
 */
exports.getAllMovies = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, genre, minRating } = req.query;

  const filter = {};
  
  if (genre) {
    filter.genres = new RegExp(genre, 'i');
  }
  
  if (minRating) {
    filter.rating = { $gte: parseFloat(minRating) };
  }

  const skip = (page - 1) * limit;

  const movies = await Movie.find(filter)
    .sort({ rating: -1, watchCount: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await Movie.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Helper function to highlight matching text
function highlightText(text, query) {
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark style="background-color: yellow;">$1</mark>');
}

module.exports = exports;