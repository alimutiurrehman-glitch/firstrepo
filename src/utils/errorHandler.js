// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    err.statusCode = 400;
    err.message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    err.statusCode = 400;
    err.message = 'Duplicate field value entered';
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    err.statusCode = 400;
    err.message = `Invalid ${err.path}: ${err.value}`;
  }

  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = { AppError, errorHandler, catchAsync };

