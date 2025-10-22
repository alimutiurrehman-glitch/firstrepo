const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  subscriptionType: {
    type: String,
    enum: ['free', 'premium', 'vip'],
    default: 'free'
  }
}, {
  timestamps: true
});

// Email is already indexed via unique: true

module.exports = mongoose.model('User', userSchema);

