const stringSimilarity = require('string-similarity');

/**
 * Calculate hybrid search ranking score
 * Combines text similarity, rating, and popularity
 */
function calculateHybridScore(movie, searchQuery, weights = { similarity: 0.5, rating: 0.3, popularity: 0.2 }) {
  // Text similarity score (0-1) - improved for partial matches
  const query = searchQuery.toLowerCase();
  const title = movie.title.toLowerCase();
  
  // Check if query is contained in title - STRICT matching only
  let titleSimilarity = 0;
  if (title.includes(query)) {
    // Exact substring match gets high score
    titleSimilarity = 0.9 + (query.length / title.length) * 0.1; // 0.9 to 1.0
  } else {
    // NO fuzzy matching - only exact substring matches
    titleSimilarity = 0;
  }
  
  // Director similarity
  const directorSimilarity = movie.director 
    ? stringSimilarity.compareTwoStrings(query, movie.director.toLowerCase())
    : 0;
  
  // Cast similarity - STRICT matching only
  let castSimilarity = 0;
  if (movie.cast && movie.cast.length > 0) {
    const castScores = movie.cast.map(c => {
      const castName = c.name.toLowerCase();
      if (castName.includes(query)) {
        return 0.7 + (query.length / castName.length) * 0.3;
      }
      return 0; // NO fuzzy matching for cast
    });
    castSimilarity = Math.max(...castScores);
  }
  
  // Genre similarity - STRICT matching only
  let genreSimilarity = 0;
  if (movie.genres && movie.genres.length > 0) {
    const genreScores = movie.genres.map(g => {
      const genre = g.toLowerCase();
      if (genre.includes(query)) {
        return 0.6;
      }
      return 0; // NO fuzzy matching for genres
    });
    genreSimilarity = Math.max(...genreScores);
  }
  
  // Take best similarity score
  const textScore = Math.max(titleSimilarity, directorSimilarity, castSimilarity, genreSimilarity);
  
  // Normalize rating (0-1)
  const ratingScore = movie.rating / 10;
  
  // Normalize popularity (assuming max watchCount around 1000)
  const popularityScore = Math.min(movie.watchCount / 1000, 1);
  
  // Calculate weighted final score
  const finalScore = (
    textScore * weights.similarity +
    ratingScore * weights.rating +
    popularityScore * weights.popularity
  );
  
  return {
    finalScore,
    textScore,
    ratingScore,
    popularityScore
  };
}

/**
 * Filter movies by genre
 */
function filterByGenre(movies, genre) {
  if (!genre) return movies;
  return movies.filter(movie => 
    movie.genres && movie.genres.some(g => 
      g.toLowerCase().includes(genre.toLowerCase())
    )
  );
}

/**
 * Filter movies by minimum rating
 */
function filterByRating(movies, minRating) {
  if (!minRating) return movies;
  return movies.filter(movie => movie.rating >= parseFloat(minRating));
}

/**
 * Apply pagination to results
 */
function paginate(items, page = 1, limit = 10) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: items.slice(startIndex, endIndex),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: items.length,
      pages: Math.ceil(items.length / limit)
    }
  };
}

module.exports = {
  calculateHybridScore,
  filterByGenre,
  filterByRating,
  paginate
};

