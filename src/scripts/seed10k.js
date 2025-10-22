const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const User = require('../models/User');
const Review = require('../models/Review');
const WatchHistory = require('../models/WatchHistory');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Sample data generators for users
const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Adventure', 'Fantasy', 'Animation'];
const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Amy', 'Tom', 'Emma', 'Alex', 'Maria', 'James', 'Anna', 'Robert', 'Kate'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

const reviewTexts = [
  'Amazing movie! Highly recommended.', 'Great storyline and acting.', 'Could be better, but still enjoyable.',
  'One of the best movies I\'ve seen.', 'Not my cup of tea, but well made.', 'Outstanding cinematography.',
  'Good entertainment value.', 'Disappointing ending.', 'Brilliant direction and cast.', 'Average movie, nothing special.',
  'Must watch!', 'Waste of time.', 'Perfect for a weekend watch.', 'Too long and boring.', 'Short and sweet.',
  'Excellent character development.', 'Poor script but good visuals.', 'Classic masterpiece.', 'Modern take on old story.',
  'Innovative and fresh approach.', 'Predictable but fun.', 'Unexpected plot twists.', 'Great family movie.',
  'Not suitable for children.', 'Perfect date night movie.', 'Action-packed thriller.', 'Emotional drama.',
  'Comedy gold!', 'Horror masterpiece.', 'Sci-fi at its best.'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function loadMoviesFromJson() {
  try {
    const filePath = path.join(__dirname, 'movies.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const movies = JSON.parse(rawData);
    
    // Transform the JSON format to match your Movie schema
    return movies.map(movie => ({
      title: movie.title,
      description: movie.description || `A captivating ${movie.genres?.[0] || 'movie'} that will keep you entertained.`,
      genres: movie.genres || [],
      releaseYear: movie.releaseYear,
      rating: movie.rating || 0,
      duration: movie.runtime || 120,
      cast: movie.cast?.map(actor => ({
        name: actor,
        role: 'Actor'
      })) || [],
      director: movie.director || 'Unknown',
      posterUrl: movie.posterUrl || `https://via.placeholder.com/300x450/0066cc/ffffff?text=${encodeURIComponent(movie.title)}`,
      trailerUrl: `https://example.com/trailer/${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    }));
  } catch (error) {
    console.error('Error reading movies.json:', error);
    throw error;
  }
}

function generateRandomUser() {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  
  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@example.com`,
    preferences: {
      favoriteGenres: getRandomElements(genres, Math.floor(Math.random() * 3) + 1),
      language: 'English',
      quality: getRandomElement(['HD', '4K', 'SD'])
    },
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
  };
}

function generateRandomReview(movieId, userId) {
  return {
    movieId,
    userId,
    rating: Math.floor(Math.random() * 10) + 1,
    reviewText: getRandomElement(reviewTexts),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  };
}

function generateRandomWatchHistory(movieId, userId) {
  const watchDuration = 30 + Math.floor(Math.random() * 150); // 30-180 minutes
  const completionPercentage = Math.min(100, Math.max(0, Math.floor(Math.random() * 100)));
  const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

  return {
    userId,
    movieId,
    watchDuration,
    completionPercentage,
    timestamp,
    createdAt: timestamp
  };
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Clear existing data
    console.log('Clearing existing data...');
    await Movie.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    await WatchHistory.deleteMany({});
    console.log('Existing data cleared.');

    // Load and insert movies from JSON file
    console.log('Loading movies from movies.json...');
    const movies = loadMoviesFromJson();
    console.log(`Loaded ${movies.length} movies from file.`);
    
    const insertedMovies = await Movie.insertMany(movies);
    console.log(`Inserted ${insertedMovies.length} movies.`);

    // Generate and insert users (1000 users)
    console.log('Generating users...');
    const users = [];
    for (let i = 0; i < 1000; i++) {
      users.push(generateRandomUser());
    }
    const insertedUsers = await User.insertMany(users);
    console.log(`Inserted ${insertedUsers.length} users.`);

    // Generate and insert reviews (5000 reviews)
    console.log('Generating reviews...');
    const reviews = [];
    for (let i = 0; i < 5000; i++) {
      const movieId = getRandomElement(insertedMovies)._id;
      const userId = getRandomElement(insertedUsers)._id;
      reviews.push(generateRandomReview(movieId, userId));
    }
    const insertedReviews = await Review.insertMany(reviews);
    console.log(`Inserted ${insertedReviews.length} reviews.`);

    // Generate and insert watch history (10000 entries)
    console.log('Generating watch history...');
    const watchHistories = [];
    for (let i = 0; i < 10000; i++) {
      const movieId = getRandomElement(insertedMovies)._id;
      const userId = getRandomElement(insertedUsers)._id;
      watchHistories.push(generateRandomWatchHistory(movieId, userId));
    }
    const insertedWatchHistories = await WatchHistory.insertMany(watchHistories);
    console.log(`Inserted ${insertedWatchHistories.length} watch history entries.`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Movies: ${insertedMovies.length}`);
    console.log(`   - Users: ${insertedUsers.length}`);
    console.log(`   - Reviews: ${insertedReviews.length}`);
    console.log(`   - Watch History: ${insertedWatchHistories.length}`);
    console.log(`   - Total Records: ${insertedMovies.length + insertedUsers.length + insertedReviews.length + insertedWatchHistories.length}`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();