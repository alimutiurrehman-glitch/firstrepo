const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Utility to safely parse JSON strings
const safeJSONParse = (str) => {
  try {
    if (!str || str === 'null') return null;
    return JSON.parse(str.replace(/'/g, '"'));
  } catch {
    return null;
  }
};

// Read and filter movies from CSV
async function readAndFilterMovies() {
  return new Promise((resolve, reject) => {
    const movies = [];
    const csvPath = path.join(__dirname, '../../TMDB_movie_dataset_v11.csv');

    const stream = fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Filter: only movies with valid title, release date, and rating
        if (row.title && row.release_date && row.vote_average && parseFloat(row.vote_average) > 5) {
          
          // Parse genres - improved parsing
          let genreList = [];
          try {
            if (row.genres && row.genres !== '[]') {
              // Try to parse as JSON array
              const genres = JSON.parse(row.genres);
              if (Array.isArray(genres)) {
                genreList = genres.map(g => g.name || g).filter(g => g);
              }
            }
          } catch (e) {
            // If JSON parsing fails, try to extract genre names manually
            if (row.genres) {
              const genreMatches = row.genres.match(/"name":\s*"([^"]+)"/g);
              if (genreMatches) {
                genreList = genreMatches.map(match => 
                  match.replace(/"name":\s*"/, '').replace(/"$/, '')
                );
              }
            }
          }

          // Parse cast and crew
          const cast = safeJSONParse(row.credits);
          let castList = [];
          let director = 'Unknown';

          if (cast && cast.cast) {
            castList = cast.cast.slice(0, 8).map(c => ({
              name: c.name,
              role: c.character || 'Actor'
            }));
          }

          if (cast && cast.crew) {
            const directorObj = cast.crew.find(c => c.job === 'Director');
            if (directorObj) director = directorObj.name;
          }

          // Extract year from release_date
          const releaseYear = row.release_date ? parseInt(row.release_date.split('-')[0]) : 2020;

          // Build poster URL
          const posterUrl = row.poster_path 
            ? `https://image.tmdb.org/t/p/w500${row.poster_path}` 
            : '';

          movies.push({
            title: row.title,
            releaseYear,
            genres: genreList,
            cast: castList,
            director,
            rating: parseFloat(row.vote_average) || 0,
            posterUrl,
            description: row.overview || '',
            watchCount: Math.floor(Math.random() * 500)
          });
        }

        // Limit to 800 movies for manageable dataset
        if (movies.length >= 800) {
          stream.destroy();
          resolve(movies);
          return;
        }
      })
      .on('end', () => {
        console.log(`✅ Processed ${movies.length} movies from CSV`);
        resolve(movies);
      })
      .on('error', reject);
  });
}

// Generate sample users
function generateUsers(count) {
  const users = [];
  const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'Robert', 'Isabella',
                      'William', 'Mia', 'Daniel', 'Charlotte', 'Matthew', 'Amelia', 'Joseph', 'Harper', 'Christopher', 'Evelyn'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                     'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'White', 'Harris'];
  const subscriptionTypes = ['free', 'premium', 'vip'];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    users.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      subscriptionType: subscriptionTypes[Math.floor(Math.random() * subscriptionTypes.length)]
    });
  }

  return users;
}

// Generate watch history
function generateWatchHistory(movies, users, count) {
  const history = [];
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    const randomTimestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
    
    history.push({
      userId: randomUser._id || randomUser.email, // Will be replaced with actual ID during seeding
      movieId: randomMovie._id || randomMovie.title, // Will be replaced with actual ID during seeding
      timestamp: randomTimestamp,
      watchDuration: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
      completionPercentage: Math.floor(Math.random() * 100)
    });
  }

  return history;
}

// Generate reviews
function generateReviews(movies, users, watchHistory, count) {
  const reviews = [];
  const reviewTexts = [
    'Amazing movie! Highly recommend.',
    'Great storyline and acting.',
    'One of the best movies I\'ve seen.',
    'Decent movie, worth watching.',
    'Not bad, but could be better.',
    'Disappointing. Expected more.',
    'Absolute masterpiece!',
    'Good entertainment for the weekend.',
    'The cast did an excellent job.',
    'Predictable plot but enjoyable.'
  ];

  // Create reviews based on watch history
  const watchedPairs = new Set();
  
  for (let i = 0; i < count && i < watchHistory.length; i++) {
    const watch = watchHistory[i];
    const pairKey = `${watch.userId}-${watch.movieId}`;
    
    // Avoid duplicate reviews
    if (!watchedPairs.has(pairKey)) {
      watchedPairs.add(pairKey);
      
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

// Save processed data
function saveProcessedData(data) {
  const outputDir = path.join(__dirname, '../../data/processed');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save each collection to separate JSON files
  fs.writeFileSync(
    path.join(outputDir, 'movies.json'),
    JSON.stringify(data.movies, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'users.json'),
    JSON.stringify(data.users, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'watchHistory.json'),
    JSON.stringify(data.watchHistory, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'reviews.json'),
    JSON.stringify(data.reviews, null, 2)
  );

  console.log('✅ All data saved to data/processed/');
}

// Main processing function
async function processDataset() {
  console.log('📊 Starting dataset processing...\n');
  
  try {
    // Step 1: Read and filter movies
    console.log('Step 1: Reading TMDB CSV...');
    const movies = await readAndFilterMovies();
    console.log(`✅ Processed ${movies.length} movies\n`);
    
    // Step 2: Generate users
    console.log('Step 2: Generating users...');
    const users = generateUsers(30);
    console.log(`✅ Generated ${users.length} users\n`);
    
    // Step 3: Generate watch history
    console.log('Step 3: Generating watch history...');
    const watchHistory = generateWatchHistory(movies, users, 300);
    console.log(`✅ Generated ${watchHistory.length} watch history entries\n`);
    
    // Step 4: Generate reviews
    console.log('Step 4: Generating reviews...');
    const reviews = generateReviews(movies, users, watchHistory, 250);
    console.log(`✅ Generated ${reviews.length} reviews\n`);
    
    // Step 5: Save to JSON files
    console.log('Step 5: Saving processed data...');
    saveProcessedData({ movies, users, watchHistory, reviews });
    
    console.log('\n🎉 Dataset processing complete!');
    console.log('\nNext step: Run "npm run seed" to populate the database.');
    
  } catch (error) {
    console.error('❌ Error processing dataset:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  processDataset();
}

module.exports = { processDataset };

