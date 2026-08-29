const { body, param } = require('express-validator');

const leadValidation = {
  // ==================== BASIC LEAD CRUD VALIDATIONS ====================

  createLead: [
    body('FirstName')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2, max: 100 }).withMessage('First name must be between 2-100 characters'),

    body('LastName')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1-100 characters'),

    body('Email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail().withMessage('Please provide a valid email'),

    body('Phone')
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number'),

    body('AlternatePhone')
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid alternate phone number'),

    body('CompanyName')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 }).withMessage('Company name must not exceed 200 characters'),

    body('Industry')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Industry must not exceed 100 characters'),

    body('Designation')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Designation must not exceed 100 characters'),

    body('Country')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),

    body('State')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),

    body('City')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),

    body('SourceId')
      .notEmpty().withMessage('Lead source is required')
      .isInt({ min: 1 }).withMessage('Invalid lead source'),

    body('LeadTypeId')
      .notEmpty().withMessage('Lead type is required')
      .isInt({ min: 1 }).withMessage('Invalid lead type'),

    body('ServiceRequiredId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid service required'),

    body('EstimatedValue')
      .optional({ checkFalsy: true })
      .isDecimal({ decimal_digits: '0,2' }).withMessage('Estimated value must be a valid number'),

    body('Remarks')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 5000 }).withMessage('Remarks must not exceed 5000 characters'),

    body('AssignedToUserId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid assigned user')
  ],

  updateLead: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),

    body('FirstName')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('First name must be between 2-100 characters'),

    body('LastName')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1-100 characters'),

    body('Email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail().withMessage('Please provide a valid email'),

    body('Phone')
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number'),

    body('CompanyName')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 }).withMessage('Company name must not exceed 200 characters'),

    body('SourceId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid lead source'),

    body('LeadTypeId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid lead type'),

    body('ServiceRequiredId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid service required'),

    body('EstimatedValue')
      .optional({ checkFalsy: true })
      .isDecimal({ decimal_digits: '0,2' }).withMessage('Estimated value must be a valid number'),

    body('Remarks')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 5000 }).withMessage('Remarks must not exceed 5000 characters'),

    body('LeadStatusId')
      .optional({ checkFalsy: true })
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

  addBusinessInfo: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),

    body('Budget')
      .optional({ checkFalsy: true })
      .isDecimal({ decimal_digits: '0,2' }).withMessage('Budget must be a valid number'),

    body('BudgetCurrency')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 10 }).withMessage('Currency code must not exceed 10 characters')
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'])
      .withMessage('Invalid currency code'),

    body('BudgetRange')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 50 }).withMessage('Budget range must not exceed 50 characters'),

    body('Timeline')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Timeline must not exceed 100 characters'),

    body('Authority')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Authority must not exceed 100 characters'),

    body('NeedSummary')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }).withMessage('Need summary must not exceed 1000 characters'),

    body('Competition')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Competition must not exceed 500 characters'),

    body('CurrentSolution')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Current solution must not exceed 500 characters'),

    body('KeyStakeholders')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Key stakeholders must not exceed 500 characters')
  ],

  updateBusinessInfo: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid business info ID'),

    body('Budget')
      .optional({ checkFalsy: true })
      .isDecimal({ decimal_digits: '0,2' }).withMessage('Budget must be a valid number'),

    // ... (rest are same, but we can reuse if we wanted. Let's keep it clean)
    body('BudgetCurrency')
      .optional({ checkFalsy: true })
      .trim()
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'])
      .withMessage('Invalid currency code'),
      
    body('NeedSummary')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }).withMessage('Need summary must not exceed 1000 characters')
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
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Decision timeframe must not exceed 100 characters'),

    body('CompetitorAnalysis')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }).withMessage('Competitor analysis must not exceed 1000 characters')
  ],

  rejectQualification: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),

    body('reason')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
  ],

  // ==================== EMAIL VALIDATION ====================

  sendIntroEmail: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ],

  // ==================== FOLLOW-UP VALIDATIONS ====================

  createLeadFollowUp: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),

    body('FollowUpDate')
      .notEmpty().withMessage('Follow-up date is required')
      .isISO8601().withMessage('Invalid follow-up date'),

    body('FollowUpTypeId')
      .notEmpty().withMessage('Follow-up type is required')
      .isInt({ min: 1 }).withMessage('Invalid follow-up type'),

    body('Remarks')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 5000 }).withMessage('Remarks must not exceed 5000 characters'),

    body('NextFollowUpDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid next follow-up date')
  ],

  updateLeadFollowUp: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),

    param('followUpId')
      .isInt({ min: 1 }).withMessage('Invalid follow-up ID'),

    body('FollowUpDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid follow-up date'),

    body('FollowUpTypeId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid follow-up type'),

    body('Remarks')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 5000 }).withMessage('Remarks must not exceed 5000 characters'),

    body('NextFollowUpDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid next follow-up date')
  ],

  getFollowUp: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid lead ID'),

    param('followUpId')
      .isInt({ min: 1 }).withMessage('Invalid follow-up ID')
  ]
};

module.exports = leadValidation;