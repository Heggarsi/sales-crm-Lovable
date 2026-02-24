const { body, param } = require('express-validator');

const userValidation = {
  createUser: [
    body('Name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('Email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    body('Password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('RoleId')
      .notEmpty().withMessage('Role is required')
      .isInt({ min: 1 }).withMessage('Invalid role')
  ],

  updateUser: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('Name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('Email')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email'),
    body('RoleId')
      .optional()
      .isInt({ min: 1 }).withMessage('Invalid role'),
    body('IsActive')
      .optional()
      .isBoolean().withMessage('IsActive must be a boolean')
  ],

  getUserById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid user ID')
  ],

  deleteUser: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid user ID')
  ]
};

module.exports = userValidation;