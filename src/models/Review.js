const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie ID is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 10
  },
  reviewText: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index for fetching movie reviews
reviewSchema.index({ movieId: 1, createdAt: -1 });

// Unique compound index - one review per user per movie
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

