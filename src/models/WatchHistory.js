const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
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
  timestamp: {
    type: Date,
    default: Date.now
  },
  watchDuration: {
    type: Number,
    min: 0,
    default: 0,
    comment: 'Duration in minutes'
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for user history queries
watchHistorySchema.index({ userId: 1, timestamp: -1 });

// Index for movie popularity tracking
watchHistorySchema.index({ movieId: 1, timestamp: -1 });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);

