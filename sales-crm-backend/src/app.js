const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFound } = require('./middlewares/errorHandler.middleware');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  //credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));



// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

//app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/mom', require('./routes/mom.routes'));                   
app.use('/api/activities', require('./routes/activity.routes'));       
app.use('/api/opportunities', require('./routes/opportunity.routes'));       
app.use('/api/lost-opportunities', require('./routes/lostOpportunity.routes'));
app.use('/api/proposals', require('./routes/proposal.routes'));
app.use('/api/lost-orders', require('./routes/lostOrder.routes'));
app.use('/api/salesorders', require('./routes/salesorder.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;