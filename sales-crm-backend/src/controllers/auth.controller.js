const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const AuthService = require('../services/auth.service');
const { HTTP_STATUS } = require('../config/constants');

const AuthController = {
  // Login
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  }),

  // Refresh token
  refreshToken: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await AuthService.refreshToken(refreshToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  }),

  // Get current user
  getCurrentUser: asyncHandler(async (req, res) => {
    const user = await AuthService.getCurrentUser(req.user.UserId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    });
  }),

  // Change password
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(req.user.UserId, currentPassword, newPassword);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully'
    });
  }),

  // Logout
  logout: asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // You can implement token blacklisting here if needed
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logout successful'
    });
  })
};

module.exports = AuthController;