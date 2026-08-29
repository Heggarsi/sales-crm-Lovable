const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const userValidation = require('../validations/userValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission, isAdmin } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All user routes require authentication
router.use(authenticate);

// Get all roles (accessible to authenticated users)
router.get('/roles', UserController.getAllRoles);

// Get role by ID (accessible to authenticated users)
router.get('/roles/:id', UserController.getRoleById);

// Create role (Admin only)
router.post('/roles', isAdmin, UserController.createRole);

// Update role (Admin only)
router.put('/roles/:id', isAdmin, UserController.updateRole);

// Delete role (Admin only)
router.delete('/roles/:id', isAdmin, UserController.deleteRole);

// Get sales persons (for lead assignment - Admin & Sales Manager)
router.get(
  '/sales-persons',
  checkPermission([PERMISSIONS.ASSIGN_LEAD]),
  UserController.getSalesPersons
);

// Create user (Admin only)
router.post(
  '/',
  isAdmin,
  userValidation.createUser,
  validate,
  UserController.createUser
);

// Get all users (Admin & Sales Manager)
router.get(
  '/',
  checkPermission([PERMISSIONS.READ_USER]),
  UserController.getAllUsers
);

// Get user by ID
router.get(
  '/:id',
  userValidation.getUserById,
  validate,
  checkPermission([PERMISSIONS.READ_USER]),
  UserController.getUserById
);

// Update user
router.put(
  '/:id',
  userValidation.updateUser,
  validate,
  checkPermission([PERMISSIONS.UPDATE_USER]),
  UserController.updateUser
);

// Delete user (Admin only)
router.delete(
  '/:id',
  userValidation.deleteUser,
  validate,
  isAdmin,
  UserController.deleteUser
);

module.exports = router;