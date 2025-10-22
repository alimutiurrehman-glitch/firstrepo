const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const User = require('../models/User');
const Review = require('../models/Review');
const WatchHistory = require('../models/WatchHistory');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Database Analytics and Export Script
 * Extracts and analyzes data from the movie streaming platform database
 * Generates reports and exports data in various formats
 */

class DatabaseAnalytics {
  constructor() {
    this.outputDir = path.join(__dirname, '../../exports');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB successfully!');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async generateMovieReport() {
    console.log('\n📊 Generating Movie Analytics Report...');
    
    // Get total counts
    const totalMovies = await Movie.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalWatchHistory = await WatchHistory.countDocuments();

    // Get genre distribution
    const genreStats = await Movie.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get rating distribution
    const ratingStats = await Movie.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$rating', 2] }, then: '1-2' },
                { case: { $lt: ['$rating', 3] }, then: '2-3' },
                { case: { $lt: ['$rating', 4] }, then: '3-4' },
                { case: { $lt: ['$rating', 5] }, then: '4-5' }
              ],
              default: '5+'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get year distribution
    const yearStats = await Movie.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$releaseYear', 2000] }, then: '1990s' },
                { case: { $lt: ['$releaseYear', 2010] }, then: '2000s' },
                { case: { $lt: ['$releaseYear', 2020] }, then: '2010s' },
                { case: { $lt: ['$releaseYear', 2030] }, then: '2020s' }
              ],
              default: 'Other'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top rated movies
    const topRatedMovies = await Movie.find()
      .sort({ rating: -1 })
      .limit(20)
      .select('title releaseYear rating genres director')
      .lean();

    // Get most watched movies
    const mostWatchedMovies = await Movie.find()
      .sort({ watchCount: -1 })
      .limit(20)
      .select('title releaseYear watchCount rating genres')
      .lean();

    // Get user activity stats
    const userActivityStats = await WatchHistory.aggregate([
      {
        $group: {
          _id: '$userId',
          watchCount: { $sum: 1 },
          completedMovies: { $sum: { $cond: ['$isCompleted', 1, 0] } }
        }
      },
      {
        $group: {
          _id: null,
          avgWatchesPerUser: { $avg: '$watchCount' },
          avgCompletedPerUser: { $avg: '$completedMovies' },
          totalActiveUsers: { $sum: 1 }
        }
      }
    ]);

    // Get review statistics
    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      databaseOverview: {
        totalMovies,
        totalUsers,
        totalReviews,
        totalWatchHistoryEntries: totalWatchHistory
      },
      genreDistribution: genreStats,
      ratingDistribution: ratingStats,
      yearDistribution: yearStats,
      topRatedMovies,
      mostWatchedMovies,
      userActivityStats: userActivityStats[0] || {},
      reviewDistribution: reviewStats
    };

    // Save report to file
    const reportPath = path.join(this.outputDir, 'movie_analytics_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved to: ${reportPath}`);
    return report;
  }

  async exportMoviesToCSV() {
    console.log('\n📤 Exporting movies to CSV...');
    
    const movies = await Movie.find()
      .sort({ title: 1 })
      .lean();

    const csvHeader = 'Title,Release Year,Rating,Genres,Director,Cast,Duration,Watch Count,Description\n';
    
    const csvRows = movies.map(movie => {
      const genres = movie.genres ? movie.genres.join('; ') : '';
      const cast = movie.cast ? movie.cast.map(c => c.name).join('; ') : '';
      const description = (movie.description || '').replace(/"/g, '""');
      
      return `"${movie.title}","${movie.releaseYear}","${movie.rating}","${genres}","${movie.director || ''}","${cast}","${movie.duration || ''}","${movie.watchCount}","${description}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    const csvPath = path.join(this.outputDir, 'movies_export.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`📄 CSV exported to: ${csvPath}`);
    console.log(`📊 Exported ${movies.length} movies`);
  }

  async exportUserData() {
    console.log('\n👥 Exporting user data...');
    
    const users = await User.find()
      .select('name email preferences createdAt')
      .lean();

    const userData = users.map(user => ({
      name: user.name,
      email: user.email,
      favoriteGenres: user.preferences?.favoriteGenres || [],
      language: user.preferences?.language || 'English',
      quality: user.preferences?.quality || 'HD',
      joinedDate: user.createdAt
    }));

    const jsonPath = path.join(this.outputDir, 'users_export.json');
    fs.writeFileSync(jsonPath, JSON.stringify(userData, null, 2));
    
    console.log(`📄 User data exported to: ${jsonPath}`);
    console.log(`👥 Exported ${users.length} users`);
  }

  async generateSampleMovieCatalog() {
    console.log('\n🎬 Generating sample movie catalog...');
    
    const sampleMovies = await Movie.find()
      .sort({ rating: -1, watchCount: -1 })
      .limit(50)
      .lean();

    const catalog = {
      title: "Movie Streaming Platform - Sample Catalog",
      generatedAt: new Date().toISOString(),
      description: "A curated selection of movies from our streaming platform",
      totalMovies: sampleMovies.length,
      movies: sampleMovies.map(movie => ({
        id: movie._id,
        title: movie.title,
        releaseYear: movie.releaseYear,
        rating: movie.rating,
        genres: movie.genres,
        director: movie.director,
        cast: movie.cast?.map(c => c.name) || [],
        duration: movie.duration,
        description: movie.description,
        watchCount: movie.watchCount,
        posterUrl: movie.posterUrl
      }))
    };

    const catalogPath = path.join(this.outputDir, 'sample_movie_catalog.json');
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
    
    console.log(`📄 Sample catalog saved to: ${catalogPath}`);
  }

  async generatePlatformStats() {
    console.log('\n📈 Generating platform statistics...');
    
    // Calculate platform metrics
    const totalWatchTime = await WatchHistory.aggregate([
      { $group: { _id: null, totalTime: { $sum: '$watchDuration' } } }
    ]);

    const avgRating = await Review.aggregate([
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);

    const completionRate = await WatchHistory.aggregate([
      {
        $group: {
          _id: null,
          totalWatches: { $sum: 1 },
          completedWatches: { $sum: { $cond: ['$isCompleted', 1, 0] } }
        }
      },
      {
        $project: {
          completionRate: { $multiply: [{ $divide: ['$completedWatches', '$totalWatches'] }, 100] }
        }
      }
    ]);

    const stats = {
      platformMetrics: {
        totalWatchTime: totalWatchTime[0]?.totalTime || 0,
        averageRating: avgRating[0]?.averageRating || 0,
        completionRate: completionRate[0]?.completionRate || 0
      },
      generatedAt: new Date().toISOString()
    };

    const statsPath = path.join(this.outputDir, 'platform_statistics.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    
    console.log(`📄 Platform stats saved to: ${statsPath}`);
  }

  async printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE ANALYTICS SUMMARY');
    console.log('='.repeat(60));
    
    const totalMovies = await Movie.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalWatchHistory = await WatchHistory.countDocuments();

    console.log(`🎬 Total Movies: ${totalMovies.toLocaleString()}`);
    console.log(`👥 Total Users: ${totalUsers.toLocaleString()}`);
    console.log(`⭐ Total Reviews: ${totalReviews.toLocaleString()}`);
    console.log(`📺 Total Watch History Entries: ${totalWatchHistory.toLocaleString()}`);
    
    console.log('\n📁 Export Files Created:');
    console.log('   • movie_analytics_report.json - Comprehensive analytics');
    console.log('   • movies_export.csv - Movie data in CSV format');
    console.log('   • users_export.json - User data export');
    console.log('   • sample_movie_catalog.json - Curated movie catalog');
    console.log('   • platform_statistics.json - Platform metrics');
    
    console.log('\n✅ All exports completed successfully!');
    console.log('='.repeat(60));
  }

  async run() {
    try {
      await this.connectToDatabase();
      
      await this.generateMovieReport();
      await this.exportMoviesToCSV();
      await this.exportUserData();
      await this.generateSampleMovieCatalog();
      await this.generatePlatformStats();
      await this.printSummary();
      
    } catch (error) {
      console.error('❌ Error during analytics generation:', error);
    } finally {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the analytics if this script is executed directly
if (require.main === module) {
  const analytics = new DatabaseAnalytics();
  analytics.run();
}

module.exports = DatabaseAnalytics;
