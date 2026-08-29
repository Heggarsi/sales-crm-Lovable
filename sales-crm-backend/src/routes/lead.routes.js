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

// Get lead services (all authenticated users)
router.get('/services', LeadController.getLeadServices);

// Get follow-up types (all authenticated users)
router.get('/follow-up-types', LeadController.getLeadFollowUpTypes);

// ==================== LEAD SOURCE CRUD ====================
router.get('/sources/:sourceId', LeadController.getLeadSourceById);
router.post('/sources', LeadController.createLeadSource);
router.put('/sources/:sourceId', LeadController.updateLeadSource);
router.delete('/sources/:sourceId', LeadController.deleteLeadSource);

// ==================== LEAD TYPE CRUD ====================
router.get('/types/:typeId', LeadController.getLeadTypeById);
router.post('/types', LeadController.createLeadType);
router.put('/types/:typeId', LeadController.updateLeadType);
router.delete('/types/:typeId', LeadController.deleteLeadType);

// ==================== LEAD STATUS CRUD ====================
router.get('/statuses/:statusId', LeadController.getLeadStatusById);
router.post('/statuses', LeadController.createLeadStatus);
router.put('/statuses/:statusId', LeadController.updateLeadStatus);
router.delete('/statuses/:statusId', LeadController.deleteLeadStatus);

// ==================== LEAD SERVICE REQUIRED CRUD ====================
router.get('/services/:serviceId', LeadController.getLeadServiceById);
router.post('/services', LeadController.createLeadService);
router.put('/services/:serviceId', LeadController.updateLeadService);
router.delete('/services/:serviceId', LeadController.deleteLeadService);

// ==================== LEAD FOLLOW-UP TYPE CRUD ====================
router.get('/follow-up-types/:followUpTypeId', LeadController.getLeadFollowUpTypeById);
router.post('/follow-up-types', LeadController.createLeadFollowUpType);
router.put('/follow-up-types/:followUpTypeId', LeadController.updateLeadFollowUpType);
router.delete('/follow-up-types/:followUpTypeId', LeadController.deleteLeadFollowUpType);

// ==================== LEAD FOLLOW-UP CRUD ====================
router.get(
  '/:id/followups',
  leadValidation.getLeadById,
  validate,
  LeadController.getLeadFollowUps
);
router.get(
  '/:id/followups/:followUpId',
  leadValidation.getFollowUp,
  validate,
  LeadController.getFollowUpById
);
router.post(
  '/:id/followups',
  leadValidation.createLeadFollowUp,
  validate,
  LeadController.createLeadFollowUp
);
router.put(
  '/:id/followups/:followUpId',
  leadValidation.updateLeadFollowUp,
  validate,
  LeadController.updateLeadFollowUp
);
router.delete(
  '/:id/followups/:followUpId',
  leadValidation.getFollowUp,
  validate,
  LeadController.deleteLeadFollowUp
);

// ==================== LEAD CONVERSION ====================

// Convert lead to Account, Contact, and optionally Deal
router.post(
  '/:id/convert',
  checkPermission(PERMISSIONS.CONVERT_LEAD),
  LeadController.convertLead
);

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