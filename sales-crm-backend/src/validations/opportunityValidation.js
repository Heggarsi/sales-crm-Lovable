const { body, param, query } = require('express-validator');

const opportunityValidation = {
  // Create opportunity
  createOpportunity: [
    body('LeadId')
      .notEmpty().withMessage('Lead ID is required')
      .isInt({ min: 1 }).withMessage('Invalid Lead ID'),
    
    body('OpportunityName')
      .trim()
      .notEmpty().withMessage('Opportunity name is required')
      .isLength({ min: 5, max: 200 }).withMessage('Opportunity name must be between 5-200 characters'),
    
    body('Description')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
    
    body('EstimatedValue')
      .notEmpty().withMessage('Estimated value is required')
      .isFloat({ min: 0 }).withMessage('Estimated value must be a positive number'),
    
    body('Currency')
      .notEmpty().withMessage('Currency is required')
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'])
      .withMessage('Invalid currency code'),
    
    body('Probability')
      .optional()
      .isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0-100'),
    
    body('ExpectedCloseDate')
      .notEmpty().withMessage('Expected close date is required')
      .isISO8601().withMessage('Invalid date format'),
    
    body('CompetitorInfo')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Competitor info must not exceed 1000 characters'),
    
    body('KeyDecisionMakers')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Key decision makers must not exceed 1000 characters')
  ],

  // Update opportunity
  updateOpportunity: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid opportunity ID'),
    
    body('OpportunityName')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 }).withMessage('Opportunity name must be between 5-200 characters'),
    
    body('Description')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
    
    body('EstimatedValue')
      .optional()
      .isFloat({ min: 0 }).withMessage('Estimated value must be a positive number'),
    
    body('Currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'])
      .withMessage('Invalid currency code'),
    
    body('Probability')
      .optional()
      .isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0-100'),
    
    body('ExpectedCloseDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    
    body('CompetitorInfo')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Competitor info must not exceed 1000 characters'),
    
    body('KeyDecisionMakers')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Key decision makers must not exceed 1000 characters')
  ],

  // Get opportunity by ID
  getOpportunityById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid opportunity ID')
  ],

  // Delete opportunity
  deleteOpportunity: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid opportunity ID')
  ],

  // Update stage
  updateStage: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid opportunity ID'),
    
    body('stageId')
      .notEmpty().withMessage('Stage ID is required')
      .isInt({ min: 1, max: 6 }).withMessage('Invalid stage ID')
  ],

  // Win opportunity
  winOpportunity: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid opportunity ID'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
  ],

  // Lose opportunity
  loseOpportunity: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid opportunity ID'),
    
    body('LostReason')
      .notEmpty().withMessage('Loss reason is required')
      .trim()
      .isIn([
        'Price too high',
        'Budget constraints',
        'Lost to competitor',
        'No budget allocated',
        'Project postponed',
        'Customer went with in-house solution',
        'Product/service not a good fit',
        'Timing not right',
        'Decision maker changed',
        'Company restructuring',
        'Other'
      ]).withMessage('Invalid loss reason'),
    
    body('DetailedReason')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Detailed reason must not exceed 2000 characters'),
    
    body('CompetitorName')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Competitor name must not exceed 200 characters'),
    
    body('CompetitorPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Competitor price must be a positive number'),
    
    body('LostToCompetitor')
      .optional()
      .isBoolean().withMessage('LostToCompetitor must be a boolean'),
    
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

  // Get opportunities by lead
  getOpportunitiesByLead: [
    param('leadId')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ]
};

module.exports = opportunityValidation;