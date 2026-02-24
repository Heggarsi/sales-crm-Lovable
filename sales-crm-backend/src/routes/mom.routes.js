const express = require('express');
const router = express.Router();
const MOMController = require('../controllers/mom.controller');
const momValidation = require('../validations/momValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All MOM routes require authentication
router.use(authenticate);

// ==================== MOM CRUD ====================

// Create MOM
router.post(
  '/',
  checkPermission(PERMISSIONS.CREATE_MOM),
  momValidation.createMOM,
  validate,
  MOMController.createMOM
);

// Get all MOMs (with filtering for Sales Person)
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_MOM),
  MOMController.getAllMOMs
);

// Get MOM by ID
router.get(
  '/:id',
  momValidation.getMOMById,
  validate,
  checkPermission(PERMISSIONS.READ_MOM),
  MOMController.getMOMById
);

// Update MOM
router.put(
  '/:id',
  momValidation.updateMOM,
  validate,
  checkPermission(PERMISSIONS.UPDATE_MOM),
  MOMController.updateMOM
);

// Delete MOM
router.delete(
  '/:id',
  momValidation.deleteMOM,
  validate,
  checkPermission(PERMISSIONS.DELETE_MOM),
  MOMController.deleteMOM
);

// ==================== MOM ACTIONS ====================

// Share MOM with client
router.post(
  '/:id/share',
  momValidation.shareWithClient,
  validate,
  checkPermission(PERMISSIONS.SHARE_MOM),
  MOMController.shareWithClient
);

// ==================== APPOINTMENT/LEAD-SPECIFIC ENDPOINTS ====================

// Get MOM by appointment
router.get(
  '/appointment/:appointmentId',
  momValidation.getMOMByAppointment,
  validate,
  checkPermission(PERMISSIONS.READ_MOM),
  MOMController.getMOMByAppointment
);

// Get MOMs by lead
router.get(
  '/lead/:leadId',
  momValidation.getMOMsByLead,
  validate,
  checkPermission(PERMISSIONS.READ_MOM),
  MOMController.getMOMsByLead
);

module.exports = router;