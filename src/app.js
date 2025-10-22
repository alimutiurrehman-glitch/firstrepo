require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { errorHandler } = require('./utils/errorHandler');

// Import routes
const movieRoutes = require('./routes/movies');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');

// Initialize app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// API Routes
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api', reviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log('\n═══════════════════════════════════════');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🎬 Frontend: http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════\n');
  console.log("Hello world")
});

module.exports = app;

