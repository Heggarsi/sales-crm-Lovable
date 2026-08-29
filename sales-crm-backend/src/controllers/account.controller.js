const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const AccountService = require('../services/accountService');
const { HTTP_STATUS } = require('../config/constants');

const AccountController = {
  createAccount: asyncHandler(async (req, res) => {
    const account = await AccountService.createAccount(req.body, req.user.UserId);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Account created successfully',
      data: account
    });
  }),

  getAllAccounts: asyncHandler(async (req, res) => {
    const result = await AccountService.getAllAccounts(req.query, req.user);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Accounts retrieved successfully',
      ...result
    });
  }),

  getAccountById: asyncHandler(async (req, res) => {
    const account = await AccountService.getAccountById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account retrieved successfully',
      data: account
    });
  }),

  updateAccount: asyncHandler(async (req, res) => {
    const account = await AccountService.updateAccount(req.params.id, req.body, req.user.UserId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account updated successfully',
      data: account
    });
  }),

  deleteAccount: asyncHandler(async (req, res) => {
    await AccountService.deleteAccount(req.params.id, req.user.UserId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account deleted successfully'
    });
  })
};

module.exports = AccountController;
