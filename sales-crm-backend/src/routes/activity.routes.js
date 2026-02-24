const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activity.controller');
const activityValidation = require('../validations/activityValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All activity routes require authentication
router.use(authenticate);

// ==================== HELPER ENDPOINTS ====================

// Get activity types
router.get('/types', ActivityController.getActivityTypes);

// Get upcoming follow-ups
router.get(
  '/follow-ups/upcoming',
  checkPermission(PERMISSIONS.READ_ACTIVITY),
  ActivityController.getUpcomingFollowUps
);

// ==================== ACTIVITY CRUD ====================

// Log activity
router.post(
  '/',
  checkPermission(PERMISSIONS.CREATE_ACTIVITY),
  activityValidation.logActivity,
  validate,
  ActivityController.logActivity
);

// Get all activities (with filtering for Sales Person)
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_ACTIVITY),
  ActivityController.getAllActivities
);

// Get activity by ID
router.get(
  '/:id',
  activityValidation.getActivityById,
  validate,
  checkPermission(PERMISSIONS.READ_ACTIVITY),
  ActivityController.getActivityById
);

// Update activity
router.put(
  '/:id',
  activityValidation.updateActivity,
  validate,
  checkPermission(PERMISSIONS.UPDATE_ACTIVITY),
  ActivityController.updateActivity
);

// Delete activity
router.delete(
  '/:id',
  activityValidation.deleteActivity,
  validate,
  checkPermission(PERMISSIONS.DELETE_ACTIVITY),
  ActivityController.deleteActivity
);

// ==================== LEAD-SPECIFIC ENDPOINTS ====================

// Get activities by lead
router.get(
  '/lead/:leadId',
  activityValidation.getActivitiesByLead,
  validate,
  checkPermission(PERMISSIONS.READ_ACTIVITY),
  ActivityController.getActivitiesByLead
);

module.exports = router;