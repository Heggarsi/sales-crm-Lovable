const express = require('express');
const router = express.Router();
const LostOrderController = require('../controllers/lostOrder.controller');
const lostOrderValidation = require('../validations/lostOrderValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission, isAdmin } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All lost order routes require authentication
router.use(authenticate);

// ==================== ADVANCED FEATURES ====================

// Get loss analysis
router.get(
  '/analysis',
  checkPermission(PERMISSIONS.VIEW_REPORTS),
  LostOrderController.getLossAnalysis
);

// ==================== BASIC LOST ORDER CRUD ====================

// Get all lost orders (with filtering for Sales Person)
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_PROPOSAL),
  LostOrderController.getAllLostOrders
);

// Get lost order by ID
router.get(
  '/:id',
  lostOrderValidation.getLostOrderById,
  validate,
  checkPermission(PERMISSIONS.READ_PROPOSAL),
  LostOrderController.getLostOrderById
);

// Update lost order
router.put(
  '/:id',
  lostOrderValidation.updateLostOrder,
  validate,
  checkPermission(PERMISSIONS.UPDATE_PROPOSAL),
  LostOrderController.updateLostOrder
);

// Delete lost order (Admin only)
router.delete(
  '/:id',
  lostOrderValidation.deleteLostOrder,
  validate,
  isAdmin,
  LostOrderController.deleteLostOrder
);

// ==================== PROPOSAL-SPECIFIC ENDPOINTS ====================

// Get lost order by proposal ID
router.get(
  '/proposal/:proposalId',
  lostOrderValidation.getLostOrderByProposalId,
  validate,
  checkPermission(PERMISSIONS.READ_PROPOSAL),
  LostOrderController.getLostOrderByProposalId
);

module.exports = router;