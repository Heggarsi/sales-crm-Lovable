const UserModel = require('../models/UsersModel');
const jwtHelper = require('../utils/jwtHelper');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');

const AuthService = {
  // Login user
  login: async (email, password) => {
    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);

      if (!user) {
        throw new AppError('Invalid email', HTTP_STATUS.UNAUTHORIZED);
      }

      // Check if user is active
      if (!user.IsActive) {
        throw new AppError('Your account is inactive. Please contact administrator.', HTTP_STATUS.FORBIDDEN);
      }

      // Verify password
      const isPasswordValid = await UserModel.verifyPassword(password, user.Password);

      if (!isPasswordValid) {
        throw new AppError('Invalid password', HTTP_STATUS.UNAUTHORIZED);
      }

      // Generate tokens
      const accessToken = jwtHelper.generateAccessToken({
        userId: user.UserId,
        email: user.Email,
        roleId: user.RoleId
      });

      const refreshToken = jwtHelper.generateRefreshToken({
        userId: user.UserId
      });

      // Remove password from user object
      const { Password, ...userWithoutPassword } = user;

      logger.info('User logged in successfully', { userId: user.UserId, email: user.Email });

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      // Verify refresh token
      const decoded = jwtHelper.verifyRefreshToken(refreshToken);

      // Get user
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
      }

      if (!user.IsActive) {
        throw new AppError('Account is inactive', HTTP_STATUS.FORBIDDEN);
      }

      // Generate new access token
      const newAccessToken = jwtHelper.generateAccessToken({
        userId: user.UserId,
        email: user.Email,
        roleId: user.RoleId
      });

      return {
        accessToken: newAccessToken
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }
  },

  // Get current user profile
  getCurrentUser: async (userId) => {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      return user;
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Get user with password
      const userWithPassword = await UserModel.findByEmail(user.Email);

      // Verify current password
      const isPasswordValid = await UserModel.verifyPassword(currentPassword, userWithPassword.Password);

      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
      }

      // Update password
      await UserModel.updatePassword(userId, newPassword);

      logger.info('Password changed successfully', { userId });

      return true;
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
};

module.exports = AuthService;