const AccountModel = require('../models/AccountModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const AccountService = {
  createAccount: async (accountData, createdBy) => {
    try {
      const accountNumber = await AccountModel.getNextAccountNumber();
      const accountId = await AccountModel.create({
        ...accountData,
        AccountNumber: accountNumber,
        CreatedBy: createdBy
      });
      return await AccountModel.findById(accountId);
    } catch (error) {
      logger.error('Create account error:', error);
      throw error;
    }
  },

  getAllAccounts: async (filters, user) => {
    try {
      const result = await AccountModel.findAll(filters, user);
      return helpers.formatPaginationResponse(
        result.accounts,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all accounts error:', error);
      throw error;
    }
  },

  getAccountById: async (accountId) => {
    try {
      const account = await AccountModel.findById(accountId);
      if (!account) throw new AppError('Account not found', HTTP_STATUS.NOT_FOUND);
      return account;
    } catch (error) {
      logger.error('Get account by ID error:', error);
      throw error;
    }
  },

  updateAccount: async (accountId, updateData, userId) => {
    try {
      const account = await AccountModel.findById(accountId);
      if (!account) throw new AppError('Account not found', HTTP_STATUS.NOT_FOUND);

      await AccountModel.update(accountId, {
        ...updateData,
        UpdatedBy: userId
      });
      return await AccountModel.findById(accountId);
    } catch (error) {
      logger.error('Update account error:', error);
      throw error;
    }
  },

  deleteAccount: async (accountId, userId) => {
    try {
      const account = await AccountModel.findById(accountId);
      if (!account) throw new AppError('Account not found', HTTP_STATUS.NOT_FOUND);

      await AccountModel.delete(accountId, userId);
      return true;
    } catch (error) {
      logger.error('Delete account error:', error);
      throw error;
    }
  }
};

module.exports = AccountService;
