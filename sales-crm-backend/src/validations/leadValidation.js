const { body, param } = require('express-validator');

const leadValidation = {
  // ==================== BASIC LEAD CRUD VALIDATIONS ====================

  createLead: [
    body('CustomerName')
      .trim()
      .notEmpty().withMessage('Customer name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2-100 characters'),
    
    body('Email')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email'),
    
    body('Phone')
      .optional()
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('AlternatePhone')
      .optional()
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid alternate phone number'),
    
    body('CompanyName')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Company name must not exceed 200 characters'),
    
    body('Industry')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Industry must not exceed 100 characters'),
    
    body('Designation')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Designation must not exceed 100 characters'),
    
    body('Country')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),
    
    body('State')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
    
    body('City')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
    
    body('SourceId')
      .notEmpty().withMessage('Lead source is required')
      .isInt({ min: 1 }).withMessage('Invalid lead source'),
    
    body('LeadTypeId')
      .notEmpty().withMessage('Lead type is required')
      .isInt({ min: 1 }).withMessage('Invalid lead type'),
    
    body('AssignedToUserId')
      .optional()
      .isInt({ min: 1 }).withMessage('Invalid assigned user')
  ],

  updateLead: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),
    
    body('CustomerName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2-100 characters'),
    
    body('Email')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email'),
    
    body('Phone')
      .optional()
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('CompanyName')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Company name must not exceed 200 characters'),
    
    body('SourceId')
      .optional()
      .isInt({ min: 1 }).withMessage('Invalid lead source'),
    
    body('LeadTypeId')
      .optional()
      .isInt({ min: 1 }).withMessage('Invalid lead type'),
    
    body('LeadStatusId')
      .optional()
      .isInt({ min: 1 }).withMessage('Invalid lead status')
  ],

  getLeadById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ],

  deleteLead: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ],

  assignLead: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),
    
    body('assignedToUserId')
      .notEmpty().withMessage('Assigned user is required')
      .isInt({ min: 1 }).withMessage('Invalid assigned user ID')
  ],

  // ==================== BUSINESS INFO VALIDATIONS ====================

  addOrUpdateBusinessInfo: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),
    
    body('Budget')
      .optional()
      .isDecimal({ decimal_digits: '0,2' }).withMessage('Budget must be a valid number'),
    
    body('BudgetCurrency')
      .optional()
      .trim()
      .isLength({ max: 10 }).withMessage('Currency code must not exceed 10 characters')
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'])
      .withMessage('Invalid currency code'),
    
    body('BudgetRange')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Budget range must not exceed 50 characters'),
    
    body('Timeline')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Timeline must not exceed 100 characters'),
    
    body('Authority')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Authority must not exceed 100 characters'),
    
    body('NeedSummary')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Need summary must not exceed 1000 characters'),
    
    body('Competition')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Competition must not exceed 500 characters'),
    
    body('CurrentSolution')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Current solution must not exceed 500 characters'),
    
    body('KeyStakeholders')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Key stakeholders must not exceed 500 characters')
  ],

  // ==================== QUALIFICATION VALIDATIONS ====================

  getQualificationDetails: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ],

  acceptQualification: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),
    
    body('RequirementSummary')
      .notEmpty().withMessage('Requirement summary is required')
      .trim()
      .isLength({ min: 10, max: 1000 }).withMessage('Requirement summary must be between 10-1000 characters'),
    
    body('PainPoints')
      .notEmpty().withMessage('Pain points are required')
      .trim()
      .isLength({ min: 10, max: 1000 }).withMessage('Pain points must be between 10-1000 characters'),
    
    body('DecisionTimeframe')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Decision timeframe must not exceed 100 characters'),
    
    body('CompetitorAnalysis')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Competitor analysis must not exceed 1000 characters')
  ],

  rejectQualification: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),
    
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
  ],

  // ==================== EMAIL VALIDATION ====================

  sendIntroEmail: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ]
};

module.exports = leadValidation;