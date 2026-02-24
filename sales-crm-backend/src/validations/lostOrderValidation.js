const { body, param } = require('express-validator');

const lostOrderValidation = {
  // Get lost order by ID
  getLostOrderById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lost order ID')
  ],

  // Update lost order
  updateLostOrder: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lost order ID'),
    
    body('DetailedFeedback')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Detailed feedback must not exceed 2000 characters'),
    
    body('CompetitorWon')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Competitor name must not exceed 200 characters')
  ],

  // Delete lost order
  deleteLostOrder: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lost order ID')
  ],

  // Get lost order by proposal ID
  getLostOrderByProposalId: [
    param('proposalId')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID')
  ]
};

module.exports = lostOrderValidation;