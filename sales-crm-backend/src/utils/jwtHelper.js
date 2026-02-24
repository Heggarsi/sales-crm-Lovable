const jwt = require('jsonwebtoken');

const jwtHelper = {
  // Generate access token
  generateAccessToken: (payload) => {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
  },

  // Generate refresh token
  generateRefreshToken: (payload) => {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
  },

  // Verify access token
  verifyAccessToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },

  // Verify refresh token
  verifyRefreshToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  },

  // Decode token without verification
  decodeToken: (token) => {
    return jwt.decode(token);
  }
};

module.exports = jwtHelper;