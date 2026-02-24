const express = require('express');
const router = express.Router();
const LostOpportunityController = require('../controllers/lostOpportunity.controller');
const lostOpportunityValidation = require('../validations/lostOpportunityValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission, isAdmin } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All lost opportunity routes require authentication
router.use(authenticate);

// ==================== HELPER ENDPOINTS ====================

// Get loss reasons
router.get('/loss-reasons', LostOpportunityController.getLossReasons);

// Get loss analysis
router.get(
  '/analysis',
  checkPermission(PERMISSIONS.VIEW_REPORTS),
  LostOpportunityController.getLossAnalysis
);

// ==================== LOST OPPORTUNITY CRUD ====================

// Get all lost opportunities
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_OPPORTUNITY),
  LostOpportunityController.getAllLostOpportunities
);

// Get lost opportunity by ID
router.get(
  '/:id',
  lostOpportunityValidation.getLostOpportunityById,
  validate,
  checkPermission(PERMISSIONS.READ_OPPORTUNITY),
  LostOpportunityController.getLostOpportunityById
);

// Update lost opportunity
router.put(
  '/:id',
  lostOpportunityValidation.updateLostOpportunity,
  validate,
  checkPermission(PERMISSIONS.UPDATE_OPPORTUNITY),
  LostOpportunityController.updateLostOpportunity
);

// Delete lost opportunity (Admin only)
router.delete(
  '/:id',
  lostOpportunityValidation.deleteLostOpportunity,
  validate,
  isAdmin,
  LostOpportunityController.deleteLostOpportunity
);

// ==================== OPPORTUNITY-SPECIFIC ENDPOINTS ====================

// Get lost opportunity by opportunity ID
router.get(
  '/opportunity/:opportunityId',
  lostOpportunityValidation.getLostOpportunityByOpportunityId,
  validate,
  checkPermission(PERMISSIONS.READ_OPPORTUNITY),
  LostOpportunityController.getLostOpportunityByOpportunityId
);

module.exports = router;