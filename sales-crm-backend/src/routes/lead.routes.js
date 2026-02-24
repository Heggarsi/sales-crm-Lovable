const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/lead.controller');
const leadValidation = require('../validations/leadValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission, isAdminOrManager } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All lead routes require authentication
router.use(authenticate);

// ==================== HELPER/LOOKUP ENDPOINTS ====================

// Get lead sources (all authenticated users)
router.get('/sources', LeadController.getLeadSources);

// Get lead types (all authenticated users)
router.get('/types', LeadController.getLeadTypes);

// Get lead statuses (all authenticated users)
router.get('/statuses', LeadController.getLeadStatuses);

// Get Qualification statuses (all authenticated users)
router.get('/Qstatuses', LeadController.getLeadStatuses);
// ==================== BASIC LEAD CRUD ====================

// Create lead
router.post(
  '/',
  checkPermission(PERMISSIONS.CREATE_LEAD),
  leadValidation.createLead,
  validate,
  LeadController.createLead
);

// Get all leads (with automatic filtering for Sales Person)
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_LEAD),
  LeadController.getAllLeads
);

// Get lead by ID (with ownership check)
router.get(
  '/:id',
  leadValidation.getLeadById,
  validate,
  checkPermission(PERMISSIONS.READ_LEAD),
  LeadController.getLeadById
);

// Update lead (with ownership check)
router.put(
  '/:id',
  leadValidation.updateLead,
  validate,
  checkPermission(PERMISSIONS.UPDATE_LEAD),
  LeadController.updateLead
);

// Delete lead (with ownership check)
router.delete(
  '/:id',
  leadValidation.deleteLead,
  validate,
  checkPermission(PERMISSIONS.DELETE_LEAD),
  LeadController.deleteLead
);

// Assign lead to sales person (Admin & Sales Manager only)
router.post(
  '/:id/assign',
  leadValidation.assignLead,
  validate,
  checkPermission(PERMISSIONS.ASSIGN_LEAD),
  LeadController.assignLead
);

// ==================== BUSINESS INFO MODULE ====================

// Add or update business info (with ownership check)
router.post(
  '/:id/business-info',
  leadValidation.addOrUpdateBusinessInfo,
  validate,
  checkPermission(PERMISSIONS.UPDATE_LEAD),
  LeadController.addOrUpdateBusinessInfo
);

router.put(
  '/:id/business-info',
  leadValidation.addOrUpdateBusinessInfo,
  validate,
  checkPermission(PERMISSIONS.UPDATE_LEAD),
  LeadController.addOrUpdateBusinessInfo
);

// ==================== QUALIFICATION MODULE ====================

// Get qualification details (Lead + Business Info)
router.get(
  '/:id/qualification-details',
  leadValidation.getQualificationDetails,
  validate,
  checkPermission(PERMISSIONS.QUALIFY_LEAD),
  LeadController.getQualificationDetails
);

// Accept qualification (Qualified - creates qualification record)
router.post(
  '/:id/qualify/accept',
  leadValidation.acceptQualification,
  validate,
  checkPermission(PERMISSIONS.QUALIFY_LEAD),
  LeadController.acceptQualification
);

// Reject qualification (Unqualified - no qualification record)
router.post(
  '/:id/qualify/reject',
  leadValidation.rejectQualification,
  validate,
  checkPermission(PERMISSIONS.QUALIFY_LEAD),
  LeadController.rejectQualification
);

// ==================== EMAIL MODULE ====================

// Send introduction email
router.post(
  '/:id/send-intro-email',
  leadValidation.sendIntroEmail,
  validate,
  checkPermission(PERMISSIONS.UPDATE_LEAD),
  LeadController.sendIntroEmail
);

module.exports = router;