const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const UserService = require('../services/userService');
const { HTTP_STATUS } = require('../config/constants');

const UserController = {
  // Create user
  createUser: asyncHandler(async (req, res) => {
    const user = await UserService.createUser(req.body, req.user.UserId);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  }),

  // Get all users
  getAllUsers: asyncHandler(async (req, res) => {
    const { page, limit, roleId, isActive, search } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      roleId,
      isActive,
      search
    };

    const result = await UserService.getAllUsers(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Users retrieved successfully',
      ...result
    });
  }),

  // Get user by ID
  getUserById: asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  }),

  // Update user
  updateUser: asyncHandler(async (req, res) => {
    const user = await UserService.updateUser(
      req.params.id,
      req.body,
      req.user.UserId,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  }),

  // Delete user
  deleteUser: asyncHandler(async (req, res) => {
    await UserService.deleteUser(req.params.id, req.user.UserId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deleted successfully'
    });
  }),

  // Get all roles
  getAllRoles: asyncHandler(async (req, res) => {
    const roles = await UserService.getAllRoles();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles
    });
  }),

  // Get role by ID
  getRoleById: asyncHandler(async (req, res) => {
    const role = await UserService.getRoleById(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Role retrieved successfully',
      data: role
    });
  }),

  // Get sales persons
  getSalesPersons: asyncHandler(async (req, res) => {
    const salesPersons = await UserService.getSalesPersons();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Sales persons retrieved successfully',
      data: salesPersons
    });
  }),

  // Create role
  createRole: asyncHandler(async (req, res) => {
    const role = await UserService.createRole(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  }),

  // Update role
  updateRole: asyncHandler(async (req, res) => {
    const role = await UserService.updateRole(req.params.id, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  }),

  // Delete role
  deleteRole: asyncHandler(async (req, res) => {
    await UserService.deleteRole(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Role deleted successfully'
    });
  })
};

module.exports = UserController;