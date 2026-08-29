const { body, param } = require('express-validator');

const dealValidation = {
  createDeal: [
    body('DealName')
      .trim()
      .notEmpty().withMessage('Deal name is required')
      .isLength({ min: 2, max: 200 }).withMessage('Deal name must be between 2-200 characters'),

    body('DealStageId')
      .notEmpty().withMessage('Deal stage is required')
      .isInt({ min: 1 }).withMessage('Invalid deal stage'),

    body('ClosingDate')
      .notEmpty().withMessage('Closing date is required')
      .isISO8601().withMessage('Invalid closing date format'),

    body('AccountId')
      .notEmpty().withMessage('Account is required')
      .isInt({ min: 1 }).withMessage('Invalid account ID'),

    body('ContactId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid contact ID'),

    body('Amount')
      .optional({ checkFalsy: true })
      .isDecimal().withMessage('Amount must be a valid number'),

    body('Probability')
      .optional({ checkFalsy: true })
      .isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100'),

    body('AssignedToUserId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid assigned user')
  ],

  updateDeal: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid deal ID'),

    body('DealName')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 200 }).withMessage('Deal name must be between 2-200 characters'),

    body('DealStageId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid deal stage'),

    body('ClosingDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid closing date format'),

    body('AccountId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid account ID')
  ],

  getDealById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid deal ID')
  ],

  deleteDeal: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid deal ID')
  ]
};

module.exports = dealValidation;
