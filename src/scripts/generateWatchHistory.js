const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const User = require('../models/User');
const WatchHistory = require('../models/WatchHistory');
const connectDB = require('../config/database');

async function generateWatchHistory() {
  try {
    await connectDB();
    
    console.log('🎬 Generating realistic watch history data...');
    
    // Get all users and movies
    const users = await User.find({}).lean();
    const movies = await Movie.find({}).lean();
    
    console.log(`📊 Found ${users.length} users and ${movies.length} movies`);
    
    // Clear existing watch history
    await WatchHistory.deleteMany({});
    console.log('🗑️ Cleared existing watch history');
    
    const watchHistories = [];
    
    // Generate watch history for each user
    for (const user of users) {
      // Each user watches 10-50 movies
      const numMoviesToWatch = Math.floor(Math.random() * 40) + 10;
      
      // Get random movies for this user
      const shuffledMovies = [...movies].sort(() => 0.5 - Math.random());
      const userMovies = shuffledMovies.slice(0, numMoviesToWatch);
      
      for (const movie of userMovies) {
        // Generate realistic watch data
        const watchDuration = Math.floor(Math.random() * 180) + 30; // 30-210 minutes
        const completionPercentage = Math.floor(Math.random() * 100) + 1; // 1-100%
        
        // Generate timestamp within last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const timestamp = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
        
        watchHistories.push({
          userId: user._id,
          movieId: movie._id,
          timestamp: timestamp,
          watchDuration: watchDuration,
          completionPercentage: completionPercentage
        });
      }
      
      console.log(`✅ Generated ${numMoviesToWatch} watch entries for ${user.name}`);
    }
    
    // Insert all watch histories
    await WatchHistory.insertMany(watchHistories);
    console.log(`🎉 Generated ${watchHistories.length} total watch history entries`);
    
    // Update movie watch counts based on actual watch history
    console.log('📊 Updating movie watch counts...');
    const movieWatchCounts = {};
    
    watchHistories.forEach(entry => {
      const movieId = entry.movieId.toString();
      movieWatchCounts[movieId] = (movieWatchCounts[movieId] || 0) + 1;
    });
    
    // Update each movie's watch count
    for (const [movieId, count] of Object.entries(movieWatchCounts)) {
      await Movie.updateOne(
        { _id: movieId },
        { watchCount: count }
      );
    }
    
    console.log('✅ Updated movie watch counts based on actual watch history');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating watch history:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  generateWatchHistory();
}

module.exports = generateWatchHistory;
