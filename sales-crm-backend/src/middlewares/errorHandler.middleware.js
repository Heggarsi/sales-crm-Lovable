const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

// Custom Error Class
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    statusCode: error.statusCode,
    errors: err.errors,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // MySQL Duplicate Entry Error
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.message.match(/for key '(.+?)'/)?.[1] || 'field';
    error.message = `Duplicate value for ${field}. This value already exists.`;
    error.statusCode = HTTP_STATUS.CONFLICT;
  }

  // MySQL Foreign Key Constraint Error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record does not exist';
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
  }

  // MySQL Data Too Long
  if (err.code === 'ER_DATA_TOO_LONG') {
    error.message = 'Data too long for field';
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please login again.';
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired. Please login again.';
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }

  // Validation Errors
  if (err.name === 'ValidationError') {
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async Handler Wrapper (to avoid try-catch in every controller)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 Not Found Handler
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found - ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound
};