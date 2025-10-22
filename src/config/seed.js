require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('./database');
const Movie = require('../models/Movie');
const User = require('../models/User');
const WatchHistory = require('../models/WatchHistory');
const Review = require('../models/Review');

// Read processed JSON files
function readProcessedData() {
  const dataDir = path.join(__dirname, '../../data/processed');
  
  const movies = JSON.parse(fs.readFileSync(path.join(dataDir, 'movies.json'), 'utf8'));
  const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
  const watchHistory = JSON.parse(fs.readFileSync(path.join(dataDir, 'watchHistory.json'), 'utf8'));
  const reviews = JSON.parse(fs.readFileSync(path.join(dataDir, 'reviews.json'), 'utf8'));
  
  return { movies, users, watchHistory, reviews };
}

// Clear existing collections
async function clearCollections() {
  console.log('🗑️  Clearing existing collections...');
  
  await Movie.deleteMany({});
  await User.deleteMany({});
  await WatchHistory.deleteMany({});
  await Review.deleteMany({});
  
  console.log('✅ Collections cleared\n');
}

// Seed database
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearCollections();
    
    // Read processed data
    console.log('📖 Reading processed data files...');
    const { movies, users, watchHistory, reviews } = readProcessedData();
    console.log('✅ Data files loaded\n');
    
    // Insert movies
    console.log(`📽️  Inserting ${movies.length} movies...`);
    const insertedMovies = await Movie.insertMany(movies);
    console.log(`✅ Inserted ${insertedMovies.length} movies\n`);
    
    // Insert users
    console.log(`👥 Inserting ${users.length} users...`);
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Inserted ${insertedUsers.length} users\n`);
    
    // Create email to ID mapping for users
    const userEmailToId = {};
    insertedUsers.forEach(user => {
      userEmailToId[user.email] = user._id;
    });
    
    // Create title to ID mapping for movies
    const movieTitleToId = {};
    insertedMovies.forEach(movie => {
      movieTitleToId[movie.title] = movie._id;
    });
    
    // Update watch history with actual IDs
    console.log(`📺 Processing ${watchHistory.length} watch history entries...`);
    const validWatchHistory = watchHistory
      .map(watch => ({
        ...watch,
        userId: userEmailToId[watch.userId] || insertedUsers[0]._id,
        movieId: movieTitleToId[watch.movieId] || insertedMovies[0]._id
      }))
      .filter(watch => watch.userId && watch.movieId);
    
    const insertedHistory = await WatchHistory.insertMany(validWatchHistory);
    console.log(`✅ Inserted ${insertedHistory.length} watch history entries\n`);
    
    // Update reviews with actual IDs
    console.log(`⭐ Processing ${reviews.length} reviews...`);
    const validReviews = reviews
      .map(review => ({
        ...review,
        userId: userEmailToId[review.userId] || insertedUsers[0]._id,
        movieId: movieTitleToId[review.movieId] || insertedMovies[0]._id
      }))
      .filter(review => review.userId && review.movieId);
    
    // Remove duplicates (same user-movie pair)
    const uniqueReviews = [];
    const reviewPairs = new Set();
    
    for (const review of validReviews) {
      const pairKey = `${review.userId}-${review.movieId}`;
      if (!reviewPairs.has(pairKey)) {
        reviewPairs.add(pairKey);
        uniqueReviews.push(review);
      }
    }
    
    const insertedReviews = await Review.insertMany(uniqueReviews);
    console.log(`✅ Inserted ${insertedReviews.length} reviews\n`);
    
    // Create indexes
    console.log('📑 Creating database indexes...');
    await Movie.createIndexes();
    await User.createIndexes();
    await WatchHistory.createIndexes();
    await Review.createIndexes();
    console.log('✅ Indexes created\n');
    
    // Display summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Database seeding completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📽️  Movies: ${insertedMovies.length}`);
    console.log(`👥 Users: ${insertedUsers.length}`);
    console.log(`📺 Watch History: ${insertedHistory.length}`);
    console.log(`⭐ Reviews: ${insertedReviews.length}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('Next step: Run "npm run dev" to start the server.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

