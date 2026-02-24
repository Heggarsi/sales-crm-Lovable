const express = require('express');
const router = express.Router();
const OpportunityController = require('../controllers/opportunity.controller');
const opportunityValidation = require('../validations/opportunityValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission, isAdminOrManager } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All opportunity routes require authentication
router.use(authenticate);

// ==================== HELPER ENDPOINTS ====================

// Get opportunity stages
router.get('/stages', OpportunityController.getOpportunityStages);

// Get opportunity statuses
router.get('/statuses', OpportunityController.getOpportunityStatuses);

// Get qualified leads without opportunities (for bulk creation preview)
router.get(
  '/qualified-leads-without-opportunity',
  checkPermission(PERMISSIONS.CREATE_OPPORTUNITY),
  OpportunityController.getQualifiedLeadsWithoutOpportunity
);

// ==================== ADVANCED FEATURES ====================

// Get pipeline view
router.get(
  '/pipeline',
  checkPermission(PERMISSIONS.READ_OPPORTUNITY),
  OpportunityController.getPipeline
);

// Get forecast
router.get(
  '/forecast',
  checkPermission(PERMISSIONS.READ_OPPORTUNITY),
  OpportunityController.getForecast
);

// Generate opportunity report
router.get(
  '/report',
  checkPermission(PERMISSIONS.VIEW_REPORTS),
  OpportunityController.generateOpportunityReport
);

// Bulk create opportunities from all qualified leads
router.post(
  '/bulk-create-from-qualified-leads',
  checkPermission(PERMISSIONS.CREATE_OPPORTUNITY),
  OpportunityController.bulkCreateOpportunitiesFromQualifiedLeads
);

// ==================== BASIC OPPORTUNITY CRUD ====================

// Create opportunity
router.post(
  '/',
  checkPermission(PERMISSIONS.CREATE_OPPORTUNITY),
  opportunityValidation.createOpportunity,
  validate,
  OpportunityController.createOpportunity
);

// Get all opportunities (with filtering for Sales Person)
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_OPPORTUNITY),
  OpportunityController.getAllOpportunities
);

// Get opportunity by ID
router.get(
  '/:id',
  opportunityValidation.getOpportunityById,
  validate,
  checkPermission(PERMISSIONS.READ_OPPORTUNITY),
  OpportunityController.getOpportunityById
);

// Update opportunity
router.put(
  '/:id',
  opportunityValidation.updateOpportunity,
  validate,
  checkPermission(PERMISSIONS.UPDATE_OPPORTUNITY),
  OpportunityController.updateOpportunity
);

// Delete opportunity (Admin & Sales Manager only)
router.delete(
  '/:id',
  opportunityValidation.deleteOpportunity,
  validate,
  isAdminOrManager,
  OpportunityController.deleteOpportunity
);

// ==================== OPPORTUNITY ACTIONS ====================

// Update stage
router.put(
  '/:id/stage',
  opportunityValidation.updateStage,
  validate,
  checkPermission(PERMISSIONS.UPDATE_OPPORTUNITY),
  OpportunityController.updateStage
);

// Win opportunity
router.post(
  '/:id/win',
  opportunityValidation.winOpportunity,
  validate,
  checkPermission(PERMISSIONS.UPDATE_OPPORTUNITY),
  OpportunityController.winOpportunity
);

// Lose opportunity
router.post(
  '/:id/lose',
  opportunityValidation.loseOpportunity,
  validate,
  checkPermission(PERMISSIONS.UPDATE_OPPORTUNITY),
  OpportunityController.loseOpportunity
);

// ==================== LEAD-SPECIFIC ENDPOINTS ====================

// Get opportunities by lead
router.get(
  '/lead/:leadId',
  opportunityValidation.getOpportunitiesByLead,
  validate,
  checkPermission(PERMISSIONS.READ_OPPORTUNITY),
  OpportunityController.getOpportunitiesByLead
);

module.exports = router;