const { asyncHandler, AppError } = require('./errorHandler.middleware');
const { pool } = require('../config/database');
const jwtHelper = require('../utils/jwtHelper');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

// Authenticate user by JWT token
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided. Please login.', HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwtHelper.verifyAccessToken(token);

    // Get user from database with role information
    const [users] = await pool.query(
      `SELECT 
        u.UserId,
        u.Name,
        u.Email,
        u.RoleId,
        u.IsActive,
        u.IsDeleted,
        r.RoleName
       FROM users u 
       LEFT JOIN userrole r ON u.RoleId = r.RoleId 
       WHERE u.UserId = ?`,
      [decoded.userId]
    );

    if (users.length === 0) {
      throw new AppError('User not found.', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = users[0];

    // Check if user is active
    if (!user.IsActive || user.IsDeleted) {
      throw new AppError('User account is inactive or deleted.', HTTP_STATUS.UNAUTHORIZED);
    }

    // Attach user to request object
    req.user = user;
    
    logger.debug('User authenticated', { userId: user.UserId, email: user.Email });
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Authentication failed. Please login again.', HTTP_STATUS.UNAUTHORIZED);
  }
});

// Optional authentication (doesn't fail if no token)
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwtHelper.verifyAccessToken(token);
      
      const [users] = await pool.query(
        `SELECT 
          u.UserId,
          u.Name,
          u.Email,
          u.RoleId,
          u.IsActive,
          r.RoleName
         FROM users u 
         LEFT JOIN userrole r ON u.RoleId = r.RoleId 
         WHERE u.UserId = ? AND u.IsActive = 1 AND u.IsDeleted = 0`,
        [decoded.userId]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    } catch (error) {
      // Continue without user if token is invalid
      logger.debug('Optional auth failed, continuing without user');
    }
  }

  next();
});

module.exports = {
  authenticate,
  optionalAuth
};