const { body, param, query } = require('express-validator');

const proposalValidation = {
  // Create proposal
  createProposal: [
    body('OpportunityId')
      .notEmpty().withMessage('Opportunity ID is required')
      .isInt({ min: 1 }).withMessage('Invalid Opportunity ID'),
    
    body('ProposalTitle')
      .trim()
      .notEmpty().withMessage('Proposal title is required')
      .isLength({ min: 10, max: 200 }).withMessage('Proposal title must be between 10-200 characters'),
    
    body('ProposalAmount')
      .notEmpty().withMessage('Proposal amount is required')
      .isFloat({ min: 0.01 }).withMessage('Proposal amount must be a positive number greater than 0'),
    
    body('Currency')
      .notEmpty().withMessage('Currency is required')
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'])
      .withMessage('Invalid currency code'),
    
    body('ValidityDate')
      .optional()
      .isISO8601().withMessage('Invalid validity date format')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Validity date must be in the future');
        }
        return true;
      }),
    
    body('PaymentTerms')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Payment terms must not exceed 2000 characters'),
    
    body('DeliveryTerms')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Delivery terms must not exceed 2000 characters'),
    
    body('InternalNotes')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Internal notes must not exceed 2000 characters')
  ],

  // Update proposal
  updateProposal: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID'),
    
    body('ProposalTitle')
      .optional()
      .trim()
      .isLength({ min: 10, max: 200 }).withMessage('Proposal title must be between 10-200 characters'),
    
    body('ProposalAmount')
      .optional()
      .isFloat({ min: 0.01 }).withMessage('Proposal amount must be a positive number greater than 0'),
    
    body('Currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'])
      .withMessage('Invalid currency code'),
    
    body('ValidityDate')
      .optional()
      .isISO8601().withMessage('Invalid validity date format')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Validity date must be in the future');
        }
        return true;
      }),
    
    body('PaymentTerms')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Payment terms must not exceed 2000 characters'),
    
    body('DeliveryTerms')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Delivery terms must not exceed 2000 characters'),
    
    body('InternalNotes')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Internal notes must not exceed 2000 characters')
  ],

  // Get proposal by ID
  getProposalById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID')
  ],

  // Delete proposal
  deleteProposal: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID')
  ],

  // Submit proposal
  submitProposal: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID')
  ],

  // Approve proposal
  approveProposal: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
  ],

  // Reject proposal
  rejectProposal: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID'),
    
    body('Reason')
      .notEmpty().withMessage('Rejection reason is required')
      .trim()
      .isIn([
        'Pricing too high',
        'Insufficient features',
        'Client chose competitor',
        'Budget constraints',
        'Timeline concerns',
        'Technical limitations',
        'Poor proposal quality',
        'Client relationship issues',
        'Decision maker changed',
        'Project cancelled',
        'Other'
      ]).withMessage('Invalid rejection reason'),
    
    body('DetailedFeedback')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Detailed feedback must not exceed 2000 characters'),
    
    body('CompetitorWon')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Competitor name must not exceed 200 characters')
  ],

  // Create revision
  createRevision: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID')
  ],

  // Upload document
  uploadDocument: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID')
  ],

  // Download document
  downloadDocument: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID')
  ],

  // Link appointment
  linkAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID'),
    
    body('appointmentId')
      .notEmpty().withMessage('Appointment ID is required')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID')
  ],

  // Get proposals by opportunity
  getProposalsByOpportunity: [
    param('opportunityId')
      .isInt({ min: 1 }).withMessage('Invalid opportunity ID')
  ],

  // Get expiring proposals
  getExpiringProposals: [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 }).withMessage('Days must be between 1-365')
  ]
};

module.exports = proposalValidation;