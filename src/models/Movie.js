const mongoose = require('mongoose');

const castMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: 'Actor' }
}, { _id: false });

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true
  },
  releaseYear: {
    type: Number,
    min: 1800,
    max: 2030
  },
  genres: [{
    type: String,
    trim: true
  }],
  cast: [castMemberSchema],
  director: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  posterUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  watchCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Text index for search functionality
movieSchema.index({ title: 'text', director: 'text', 'cast.name': 'text' });

// Compound index for sorting by rating and popularity
movieSchema.index({ rating: -1, watchCount: -1 });

// Individual indexes for faster regex searches
movieSchema.index({ title: 1 });
movieSchema.index({ director: 1 });
movieSchema.index({ genres: 1 });

// Virtual for average review rating (populated later)
movieSchema.virtual('averageReviewRating', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'movieId',
  justOne: false
});

// Enable virtuals in JSON
movieSchema.set('toJSON', { virtuals: true });
movieSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Movie', movieSchema);

