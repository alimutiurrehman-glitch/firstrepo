require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const connectDB = require('../config/database');

const TMDB_API_KEY = 'f9bd8cfd2da4e854319d07fa5d8b90a1'; // Free TMDB API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function fetchRealMovies() {
  try {
    await connectDB();
    
    console.log('🎬 Fetching real movies from TMDB...');
    
    // Clear existing movies
    await Movie.deleteMany({});
    console.log('✅ Cleared existing movies');
    
    const movies = [];
    
    // Fetch popular movies from TMDB (50 pages = ~1000 movies)
    for (let page = 1; page <= 50; page++) {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
        params: {
          api_key: TMDB_API_KEY,
          page: page
        }
      });
      
      for (const movie of response.data.results) {
        movies.push({
          title: movie.title,
          releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
          genres: [], // Will be filled with genre names
          cast: [],
          director: 'Unknown',
          rating: movie.vote_average || 0,
          posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : '',
          description: movie.overview || 'No description available',
          watchCount: Math.floor(Math.random() * 1000),
          runtime: Math.floor(Math.random() * 120) + 60
        });
      }
      
      console.log(`📥 Fetched page ${page}/50 (${movies.length} movies)`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    // Insert movies into database
    await Movie.insertMany(movies);
    console.log(`✅ Inserted ${movies.length} real movies with TMDB images`);
    
    // Show sample
    const sample = await Movie.findOne({});
    console.log('\n📽️ Sample movie:');
    console.log('Title:', sample.title);
    console.log('Year:', sample.releaseYear);
    console.log('Rating:', sample.rating);
    console.log('Poster:', sample.posterUrl);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchRealMovies();

