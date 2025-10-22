const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { validators, validate } = require('../utils/validators');

// Search movies
router.get('/search', validators.searchMovies, validate, movieController.searchMovies);

// Get trending movies
router.get('/trending', movieController.getTrendingMovies);

// Get all movies
router.get('/', movieController.getAllMovies);

// Get single movie
router.get('/:id', validators.objectId('id'), validate, movieController.getMovieById);

module.exports = router;

