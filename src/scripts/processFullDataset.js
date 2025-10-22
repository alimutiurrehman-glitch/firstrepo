const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

const processedDir = path.join(__dirname, '../../data/processed');
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

const movies = [];
const users = [];
const watchHistories = [];
const reviews = [];

// Sample data for users, watch histories, and reviews
const sampleUsers = [
  { name: "John Smith", email: "user1@email.com", subscriptionType: "free" },
  { name: "Sarah Johnson", email: "user2@email.com", subscriptionType: "premium" },
  { name: "Mike Wilson", email: "user3@email.com", subscriptionType: "free" },
  { name: "Emma Brown", email: "user4@email.com", subscriptionType: "vip" },
  { name: "David Davis", email: "user5@email.com", subscriptionType: "free" },
  { name: "Lisa Garcia", email: "user6@email.com", subscriptionType: "premium" },
  { name: "Tom Miller", email: "user7@email.com", subscriptionType: "free" },
  { name: "Anna Martinez", email: "user8@email.com", subscriptionType: "vip" },
  { name: "Chris Taylor", email: "user9@email.com", subscriptionType: "free" },
  { name: "Maria Rodriguez", email: "user10@email.com", subscriptionType: "premium" },
  { name: "James Anderson", email: "user11@email.com", subscriptionType: "free" },
  { name: "Jennifer White", email: "user12@email.com", subscriptionType: "vip" },
  { name: "Robert Thomas", email: "user13@email.com", subscriptionType: "free" },
  { name: "Linda Jackson", email: "user14@email.com", subscriptionType: "premium" },
  { name: "Michael Harris", email: "user15@email.com", subscriptionType: "free" },
  { name: "Susan Clark", email: "user16@email.com", subscriptionType: "vip" },
  { name: "William Lewis", email: "user17@email.com", subscriptionType: "free" },
  { name: "Karen Walker", email: "user18@email.com", subscriptionType: "premium" },
  { name: "Richard Hall", email: "user19@email.com", subscriptionType: "free" },
  { name: "Nancy Allen", email: "user20@email.com", subscriptionType: "vip" }
];

const genres = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", 
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", 
  "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"
];

const castNames = [
  "Leonardo DiCaprio", "Brad Pitt", "Tom Hanks", "Morgan Freeman", "Robert De Niro",
  "Al Pacino", "Denzel Washington", "Will Smith", "Johnny Depp", "Tom Cruise",
  "Matt Damon", "Ryan Gosling", "Christian Bale", "Hugh Jackman", "Ryan Reynolds",
  "Scarlett Johansson", "Jennifer Lawrence", "Emma Stone", "Natalie Portman", "Anne Hathaway",
  "Meryl Streep", "Cate Blanchett", "Nicole Kidman", "Charlize Theron", "Sandra Bullock",
  "Julia Roberts", "Reese Witherspoon", "Angelina Jolie", "Kate Winslet", "Amy Adams",
  "Christopher Nolan", "Steven Spielberg", "Martin Scorsese", "Quentin Tarantino", "Ridley Scott",
  "James Cameron", "Peter Jackson", "Tim Burton", "David Fincher", "Clint Eastwood"
];

function parseGenres(genreString) {
  if (!genreString || genreString.trim() === '') return [];
  
  try {
    // Handle comma-separated genres
    if (genreString.includes(',')) {
      return genreString.split(',').map(g => g.trim()).filter(g => g && g !== '');
    }
    
    // Handle JSON-like format
    if (genreString.includes('"name"')) {
      const matches = genreString.match(/"name":\s*"([^"]+)"/g);
      if (matches) {
        return matches.map(match => match.replace(/"name":\s*"/, '').replace(/"$/, ''));
      }
    }
    
    // Single genre
    return [genreString.trim()];
  } catch (e) {
    console.log('Error parsing genres:', genreString);
    return [];
  }
}

function parseCast(castString) {
  if (!castString || castString.trim() === '') return [];
  
  try {
    // For now, return a sample cast for each movie
    const numCastMembers = Math.floor(Math.random() * 5) + 3; // 3-7 cast members
    const selectedCast = [];
    
    for (let i = 0; i < numCastMembers; i++) {
      const randomActor = castNames[Math.floor(Math.random() * castNames.length)];
      if (!selectedCast.some(cast => cast.name === randomActor)) {
        selectedCast.push({
          name: randomActor,
          character: `Character ${i + 1}`
        });
      }
    }
    
    return selectedCast;
  } catch (e) {
    console.log('Error parsing cast:', castString);
    return [];
  }
}

function generateWatchHistories(movieCount, users) {
  const histories = [];
  const entriesPerUser = Math.floor(Math.random() * 15) + 5; // 5-19 entries per user
  
  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex];
    const userEntries = Math.floor(Math.random() * entriesPerUser) + 5;
    const watchedMovies = new Set();
    
    for (let i = 0; i < userEntries; i++) {
      let movieId;
      do {
        movieId = Math.floor(Math.random() * movieCount);
      } while (watchedMovies.has(movieId));
      
      watchedMovies.add(movieId);
      
      const watchDuration = Math.floor(Math.random() * 180) + 30; // 30-210 minutes
      const completionPercentage = Math.floor(Math.random() * 100) + 1; // 1-100%
      
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor(Math.random() * 90)); // Last 90 days
      
      histories.push({
        userId: user._id,
        movieId: new mongoose.Types.ObjectId().toString(),
        timestamp: watchDate.toISOString(),
        watchDuration: watchDuration,
        completionPercentage: completionPercentage
      });
    }
  }
  
  return histories;
}

function generateReviews(movieCount, users) {
  const reviews = [];
  const reviewsPerMovie = Math.floor(Math.random() * 8) + 3; // 3-10 reviews per movie
  
  for (let movieId = 0; movieId < movieCount; movieId++) {
    const numReviews = Math.floor(Math.random() * reviewsPerMovie) + 3;
    const reviewingUsers = new Set();
    
    for (let i = 0; i < numReviews; i++) {
      let userIndex;
      do {
        userIndex = Math.floor(Math.random() * users.length);
      } while (reviewingUsers.has(userIndex));
      
      reviewingUsers.add(userIndex);
      const user = users[userIndex];
      
      const rating = Math.floor(Math.random() * 10) + 1; // 1-10
      const reviewTexts = [
        "Great movie! Highly recommended.",
        "Amazing cinematography and acting.",
        "One of the best movies I've seen this year.",
        "Good story but could be better.",
        "Excellent direction and screenplay.",
        "Not my cup of tea, but well made.",
        "Outstanding performance by the cast.",
        "Beautiful visuals and great soundtrack.",
        "A must-watch for movie lovers.",
        "Decent movie with some flaws."
      ];
      
      const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
      const helpful = Math.floor(Math.random() * 50) + 1; // 1-50 helpful votes
      
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() - Math.floor(Math.random() * 60)); // Last 60 days
      
      reviews.push({
        userId: user._id,
        movieId: new mongoose.Types.ObjectId().toString(),
        rating: rating,
        reviewText: reviewText,
        helpful: helpful,
        createdAt: reviewDate.toISOString(),
        updatedAt: reviewDate.toISOString()
      });
    }
  }
  
  return reviews;
}

async function processFullDataset() {
  console.log('🎬 Processing full TMDB dataset...');
  
  const csvPath = path.join(__dirname, '../../TMDB_movie_dataset_v11.csv');
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Skip adult movies and movies without essential data
        if (row.adult === 'True' || !row.title || !row.vote_average || !row.release_date) {
          return;
        }
        
        // Limit to first 10000 movies for comprehensive streaming platform
        if (movies.length >= 10000) {
          return;
        }
        
        const releaseYear = new Date(row.release_date).getFullYear();
        const genres = parseGenres(row.genres);
        const cast = parseCast(row.cast);
        
        // Generate synthetic data
        const watchCount = Math.floor(Math.random() * 1000) + 100; // 100-1100 views
        const director = castNames.filter(name => 
          name.includes('Christopher') || name.includes('Steven') || 
          name.includes('Martin') || name.includes('Quentin')
        )[Math.floor(Math.random() * 4)] || 'Unknown Director';
        
        const movie = {
          title: row.title,
          releaseYear: releaseYear,
          genres: genres,
          cast: cast,
          director: director,
          rating: parseFloat(row.vote_average) || 7.0,
          description: row.overview || 'No description available',
          posterUrl: row.poster_path ? `https://image.tmdb.org/t/p/w500${row.poster_path}` : null,
          watchCount: watchCount,
          runtime: parseInt(row.runtime) || 120
        };
        
        movies.push(movie);
        
        if (movies.length % 50 === 0) {
          console.log(`Processed ${movies.length} movies...`);
        }
      })
      .on('end', () => {
        console.log(`✅ Processed ${movies.length} movies from CSV`);
        
        if (movies.length === 0) {
          console.log('❌ No movies were processed. Check CSV file and filters.');
          resolve({ movies: 0, users: 0, watchHistories: 0, reviews: 0 });
          return;
        }
        
        // Generate users with proper ObjectIds
        users.push(...sampleUsers.map((user, index) => ({
          ...user,
          _id: new mongoose.Types.ObjectId().toString()
        })));
        
        // Generate watch histories
        const watchHistories = generateWatchHistories(movies.length, users);
        
        // Generate reviews
        const reviews = generateReviews(movies.length, users);
        
        // Save all data
        fs.writeFileSync(path.join(processedDir, 'movies.json'), JSON.stringify(movies, null, 2));
        fs.writeFileSync(path.join(processedDir, 'users.json'), JSON.stringify(users, null, 2));
        fs.writeFileSync(path.join(processedDir, 'watchHistories.json'), JSON.stringify(watchHistories, null, 2));
        fs.writeFileSync(path.join(processedDir, 'reviews.json'), JSON.stringify(reviews, null, 2));
        
        console.log(`✅ Generated ${users.length} users`);
        console.log(`✅ Generated ${watchHistories.length} watch history entries`);
        console.log(`✅ Generated ${reviews.length} reviews`);
        console.log(`✅ All data saved to ${processedDir}`);
        
        resolve({
          movies: movies.length,
          users: users.length,
          watchHistories: watchHistories.length,
          reviews: reviews.length
        });
      })
      .on('error', (error) => {
        console.error('❌ Error processing CSV:', error);
        reject(error);
      });
  });
}

if (require.main === module) {
  processFullDataset()
    .then((stats) => {
      console.log('\n🎉 Dataset processing complete!');
      console.log(`📊 Statistics:`);
      console.log(`   Movies: ${stats.movies}`);
      console.log(`   Users: ${stats.users}`);
      console.log(`   Watch Histories: ${stats.watchHistories}`);
      console.log(`   Reviews: ${stats.reviews}`);
    })
    .catch((error) => {
      console.error('❌ Processing failed:', error);
      process.exit(1);
    });
}

module.exports = processFullDataset;
