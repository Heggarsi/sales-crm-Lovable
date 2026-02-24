const UserModel = require('../models/UsersModel');
const UserRoleModel = require('../models/UserRoleModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const UserService = {
  // Create new user (Admin only)
  createUser: async (userData, createdBy) => {
    try {
      const { Name, Email, Password, RoleId } = userData;

      // Check if email already exists
      const existingUser = await UserModel.findByEmail(Email);
      if (existingUser) {
        throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
      }

      // Verify role exists
      const role = await UserRoleModel.findById(RoleId);
      if (!role) {
        throw new AppError('Invalid role', HTTP_STATUS.BAD_REQUEST);
      }

      // Create user
      const userId = await UserModel.create({
        Name,
        Email,
        Password,
        RoleId,
        CreatedBy: createdBy
      });

      const newUser = await UserModel.findById(userId);

      logger.info('User created successfully', { userId, createdBy });

      return newUser;
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    }
  },

  // Get all users with filters
  getAllUsers: async (filters, requestingUser) => {
    try {
      // Sales Managers can only see their team members
      if (requestingUser.RoleId === ROLES.SALES_MANAGER) {
        // You can add logic here to filter by team/region if needed
      }

      const result = await UserModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.users,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId, requestingUser) => {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Sales Person can only view their own profile
      if (requestingUser.RoleId === ROLES.SALES_PERSON && user.UserId !== requestingUser.UserId) {
        throw new AppError('You can only view your own profile', HTTP_STATUS.FORBIDDEN);
      }

      return user;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (userId, updateData, updatedBy, requestingUser) => {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Sales Person can only update their own profile (limited fields)
      if (requestingUser.RoleId === ROLES.SALES_PERSON) {
        if (user.UserId !== requestingUser.UserId) {
          throw new AppError('You can only update your own profile', HTTP_STATUS.FORBIDDEN);
        }
        // Restrict fields that can be updated
        const { Name } = updateData;
        updateData = { Name };
      }

      // If email is being updated, check for duplicates
      if (updateData.Email && updateData.Email !== user.Email) {
        const existingUser = await UserModel.findByEmail(updateData.Email);
        if (existingUser) {
          throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
        }
      }

      // If role is being updated, verify it exists
      if (updateData.RoleId) {
        const role = await UserRoleModel.findById(updateData.RoleId);
        if (!role) {
          throw new AppError('Invalid role', HTTP_STATUS.BAD_REQUEST);
        }
      }

      await UserModel.update(userId, { ...updateData, UpdatedBy: updatedBy });

      const updatedUser = await UserModel.findById(userId);

      logger.info('User updated successfully', { userId, updatedBy });

      return updatedUser;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  },

  // Delete user (soft delete)
  deleteUser: async (userId, deletedBy) => {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Prevent deleting own account
      if (userId === deletedBy) {
        throw new AppError('You cannot delete your own account', HTTP_STATUS.BAD_REQUEST);
      }

      await UserModel.delete(userId, deletedBy);

      logger.info('User deleted successfully', { userId, deletedBy });

      return true;
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  },

  // Get all roles
  getAllRoles: async () => {
    try {
      return await UserRoleModel.getAll();
    } catch (error) {
      logger.error('Get all roles error:', error);
      throw error;
    }
  },

  // Get sales persons (for lead assignment)
  getSalesPersons: async () => {
    try {
      return await UserModel.getUsersByRole(ROLES.SALES_PERSON);
    } catch (error) {
      logger.error('Get sales persons error:', error);
      throw error;
    }
  }
};

module.exports = UserService;