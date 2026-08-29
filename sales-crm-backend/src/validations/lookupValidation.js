const { body, param } = require('express-validator');

const lookupValidation = {
  createLookup: [
    body('typeName').optional().trim().notEmpty().withMessage('Type name is required'),
    body('statusName').optional().trim().notEmpty().withMessage('Status name is required'),
    body('stageName').optional().trim().notEmpty().withMessage('StageName is required'),
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  ],
  updateLookup: [
    param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
    body('typeName').optional().trim().notEmpty().withMessage('Type name is required'),
    body('statusName').optional().trim().notEmpty().withMessage('Status name is required'),
    body('stageName').optional().trim().notEmpty().withMessage('StageName is required'),
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  ],
  idParam: [
    param('id').isInt({ min: 1 }).withMessage('Invalid ID')
  ]
};

module.exports = lookupValidation;
