const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const User = require('../models/User');
const Review = require('../models/Review');
const WatchHistory = require('../models/WatchHistory');
require('dotenv').config();

// Sample data generators
const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Adventure', 'Fantasy', 'Animation'];
const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Amy', 'Tom', 'Emma', 'Alex', 'Maria', 'James', 'Anna', 'Robert', 'Kate'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

const movieTitles = [
  'The Great Adventure', 'Mystery of the Lost City', 'Love in Paris', 'Space Odyssey', 'The Last Stand',
  'Ocean Depths', 'Mountain Peak', 'City Lights', 'Desert Storm', 'Forest Guardian', 'Time Traveler',
  'Digital Dreams', 'Ancient Secrets', 'Future World', 'Hidden Truth', 'Dark Knight', 'Bright Star',
  'Silent Night', 'Loud Thunder', 'Fast Runner', 'Slow Dance', 'High Tower', 'Deep Valley',
  'Wide Ocean', 'Narrow Path', 'Big City', 'Small Town', 'Hot Summer', 'Cold Winter', 'Sweet Dreams'
];

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

function generateRandomMovie() {
  const title = getRandomElement(movieTitles) + ' ' + (Math.floor(Math.random() * 9999) + 1);
  const year = 1990 + Math.floor(Math.random() * 34);
  const rating = (Math.random() * 4 + 1).toFixed(1);
  const duration = 60 + Math.floor(Math.random() * 120);
  
  return {
    title,
    description: `An exciting ${getRandomElement(genres).toLowerCase()} movie released in ${year}. This film tells an engaging story that will keep you entertained for ${duration} minutes.`,
    genres: getRandomElements(genres, Math.floor(Math.random() * 3) + 1),
    releaseYear: year,
    rating: parseFloat(rating),
    duration,
    cast: getRandomElements(firstNames, 3).map(firstName => ({
      name: firstName + ' ' + getRandomElement(lastNames),
      role: 'Actor'
    })),
    director: getRandomElement(firstNames) + ' ' + getRandomElement(lastNames),
    posterUrl: `https://via.placeholder.com/300x450/0066cc/ffffff?text=${encodeURIComponent(title)}`,
    trailerUrl: `https://example.com/trailer/${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
  };
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

    // Generate and insert movies (2000 movies)
    console.log('Generating movies...');
    const movies = [];
    for (let i = 0; i < 2000; i++) {
      movies.push(generateRandomMovie());
    }
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
