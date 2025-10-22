const fs = require('fs');
const path = require('path');

// Create sample movies with proper genres and cast
function createSampleMovies() {
  const movies = [
    {
      title: "Interstellar",
      releaseYear: 2014,
      genres: ["Sci-Fi", "Adventure", "Drama"],
      cast: [
        { name: "Matthew McConaughey", role: "Cooper" },
        { name: "Anne Hathaway", role: "Brand" },
        { name: "Jessica Chastain", role: "Murph" }
      ],
      director: "Christopher Nolan",
      rating: 8.4,
      posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      description: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
      watchCount: 1250
    },
    {
      title: "Inception",
      releaseYear: 2010,
      genres: ["Action", "Sci-Fi", "Thriller"],
      cast: [
        { name: "Leonardo DiCaprio", role: "Cobb" },
        { name: "Marion Cotillard", role: "Mal" },
        { name: "Tom Hardy", role: "Eames" }
      ],
      director: "Christopher Nolan",
      rating: 8.8,
      posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      watchCount: 2100
    },
    {
      title: "The Dark Knight",
      releaseYear: 2008,
      genres: ["Action", "Crime", "Drama"],
      cast: [
        { name: "Christian Bale", role: "Batman" },
        { name: "Heath Ledger", role: "Joker" },
        { name: "Aaron Eckhart", role: "Harvey Dent" }
      ],
      director: "Christopher Nolan",
      rating: 9.0,
      posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
      watchCount: 3200
    },
    {
      title: "Pulp Fiction",
      releaseYear: 1994,
      genres: ["Crime", "Drama"],
      cast: [
        { name: "John Travolta", role: "Vincent Vega" },
        { name: "Samuel L. Jackson", role: "Jules Winnfield" },
        { name: "Uma Thurman", role: "Mia Wallace" }
      ],
      director: "Quentin Tarantino",
      rating: 8.9,
      posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
      watchCount: 2800
    },
    {
      title: "The Shawshank Redemption",
      releaseYear: 1994,
      genres: ["Drama"],
      cast: [
        { name: "Tim Robbins", role: "Andy Dufresne" },
        { name: "Morgan Freeman", role: "Ellis Boyd 'Red' Redding" },
        { name: "Bob Gunton", role: "Warden Norton" }
      ],
      director: "Frank Darabont",
      rating: 9.3,
      posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      watchCount: 4500
    },
    {
      title: "Avatar",
      releaseYear: 2009,
      genres: ["Action", "Adventure", "Fantasy"],
      cast: [
        { name: "Sam Worthington", role: "Jake Sully" },
        { name: "Zoe Saldana", role: "Neytiri" },
        { name: "Sigourney Weaver", role: "Dr. Grace Augustine" }
      ],
      director: "James Cameron",
      rating: 7.8,
      posterUrl: "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
      description: "A paraplegic marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
      watchCount: 1800
    },
    {
      title: "Titanic",
      releaseYear: 1997,
      genres: ["Romance", "Drama"],
      cast: [
        { name: "Leonardo DiCaprio", role: "Jack Dawson" },
        { name: "Kate Winslet", role: "Rose DeWitt Bukater" },
        { name: "Billy Zane", role: "Cal Hockley" }
      ],
      director: "James Cameron",
      rating: 7.8,
      posterUrl: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
      description: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
      watchCount: 2200
    },
    {
      title: "The Matrix",
      releaseYear: 1999,
      genres: ["Action", "Sci-Fi"],
      cast: [
        { name: "Keanu Reeves", role: "Neo" },
        { name: "Laurence Fishburne", role: "Morpheus" },
        { name: "Carrie-Anne Moss", role: "Trinity" }
      ],
      director: "The Wachowskis",
      rating: 8.7,
      posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      description: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
      watchCount: 1900
    }
  ];

  return movies;
}

// Create sample users
function createSampleUsers() {
  const users = [];
  const names = ["John Smith", "Sarah Johnson", "Mike Wilson", "Emma Brown", "David Davis", "Lisa Garcia", "Tom Miller", "Anna Martinez"];
  const subscriptionTypes = ["free", "premium", "vip"];

  for (let i = 0; i < 20; i++) {
    users.push({
      name: names[i % names.length] + (i > names.length - 1 ? ` ${Math.floor(i/names.length) + 1}` : ''),
      email: `user${i + 1}@email.com`,
      subscriptionType: subscriptionTypes[i % subscriptionTypes.length]
    });
  }

  return users;
}

// Create sample watch history
function createSampleWatchHistory(movies, users) {
  const history = [];
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 150; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    const randomTimestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
    
    history.push({
      userId: randomUser.email, // Will be replaced with actual ID during seeding
      movieId: randomMovie.title, // Will be replaced with actual ID during seeding
      timestamp: randomTimestamp,
      watchDuration: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
      completionPercentage: Math.floor(Math.random() * 100)
    });
  }

  return history;
}

// Create sample reviews
function createSampleReviews(movies, users, watchHistory) {
  const reviews = [];
  const reviewTexts = [
    "Amazing movie! Highly recommend.",
    "Great storyline and acting.",
    "One of the best movies I've seen.",
    "Decent movie, worth watching.",
    "Not bad, but could be better.",
    "Disappointing. Expected more.",
    "Absolute masterpiece!",
    "Good entertainment for the weekend.",
    "The cast did an excellent job.",
    "Predictable plot but enjoyable."
  ];

  const reviewPairs = new Set();
  
  for (let i = 0; i < 100 && i < watchHistory.length; i++) {
    const watch = watchHistory[i];
    const pairKey = `${watch.userId}-${watch.movieId}`;
    
    if (!reviewPairs.has(pairKey)) {
      reviewPairs.add(pairKey);
      
      reviews.push({
        userId: watch.userId,
        movieId: watch.movieId,
        rating: Math.floor(Math.random() * 6) + 5, // 5-10 rating
        reviewText: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        helpful: Math.floor(Math.random() * 50)
      });
    }
  }

  return reviews;
}

// Main function
async function createSampleData() {
  console.log('🎬 Creating sample movie data...\n');
  
  const movies = createSampleMovies();
  const users = createSampleUsers();
  const watchHistory = createSampleWatchHistory(movies, users);
  const reviews = createSampleReviews(movies, users, watchHistory);

  // Create output directory
  const outputDir = path.join(__dirname, '../../data/processed');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save data
  fs.writeFileSync(
    path.join(outputDir, 'movies.json'),
    JSON.stringify(movies, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'users.json'),
    JSON.stringify(users, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'watchHistory.json'),
    JSON.stringify(watchHistory, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'reviews.json'),
    JSON.stringify(reviews, null, 2)
  );

  console.log('✅ Created sample data:');
  console.log(`📽️  Movies: ${movies.length}`);
  console.log(`👥 Users: ${users.length}`);
  console.log(`📺 Watch History: ${watchHistory.length}`);
  console.log(`⭐ Reviews: ${reviews.length}`);
  console.log('\n🎉 Sample data creation complete!');
  console.log('Next step: Run "npm run seed" to populate the database.');
}

// Run if called directly
if (require.main === module) {
  createSampleData();
}

module.exports = { createSampleData };

