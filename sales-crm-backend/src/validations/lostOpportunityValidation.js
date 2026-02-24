const { body, param } = require('express-validator');

const lostOpportunityValidation = {
  // Update lost opportunity
  updateLostOpportunity: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lost opportunity ID'),
    
    body('DetailedReason')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Detailed reason must not exceed 2000 characters'),
    
    body('ClientFeedback')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Client feedback must not exceed 2000 characters'),
    
    body('LessonsLearned')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Lessons learned must not exceed 2000 characters'),
    
    body('FollowUpPlan')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Follow-up plan must not exceed 2000 characters'),
    
    body('PotentialFutureOpportunity')
      .optional()
      .isBoolean().withMessage('PotentialFutureOpportunity must be a boolean'),
    
    body('RevisitDate')
      .optional()
      .isISO8601().withMessage('Invalid revisit date format')
  ],

  // Get lost opportunity by ID
  getLostOpportunityById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lost opportunity ID')
  ],

  // Delete lost opportunity
  deleteLostOpportunity: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lost opportunity ID')
  ],

  // Get lost opportunity by opportunity ID
  getLostOpportunityByOpportunityId: [
    param('opportunityId')
      .isInt({ min: 1 }).withMessage('Invalid opportunity ID')
  ]
};

module.exports = lostOpportunityValidation;