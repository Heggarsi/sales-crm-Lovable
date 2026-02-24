const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointment.controller');
const appointmentValidation = require('../validations/appointmentValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All appointment routes require authentication
router.use(authenticate);

// ==================== HELPER ENDPOINTS ====================

// Get appointment statuses
router.get('/statuses', AppointmentController.getAppointmentStatuses);

// ==================== APPOINTMENT CRUD ====================

// Create appointment
router.post(
  '/',
  checkPermission(PERMISSIONS.CREATE_APPOINTMENT),
  appointmentValidation.createAppointment,
  validate,
  AppointmentController.createAppointment
);

// Get all appointments (with filtering for Sales Person)
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_APPOINTMENT),
  AppointmentController.getAllAppointments
);

// Get appointment by ID
router.get(
  '/:id',
  appointmentValidation.getAppointmentById,
  validate,
  checkPermission(PERMISSIONS.READ_APPOINTMENT),
  AppointmentController.getAppointmentById
);

// Update appointment
router.put(
  '/:id',
  appointmentValidation.updateAppointment,
  validate,
  checkPermission(PERMISSIONS.UPDATE_APPOINTMENT),
  AppointmentController.updateAppointment
);

// Delete appointment
router.delete(
  '/:id',
  appointmentValidation.deleteAppointment,
  validate,
  checkPermission(PERMISSIONS.DELETE_APPOINTMENT),
  AppointmentController.deleteAppointment
);

// ==================== APPOINTMENT ACTIONS ====================

// Cancel appointment
router.post(
  '/:id/cancel',
  appointmentValidation.cancelAppointment,
  validate,
  checkPermission(PERMISSIONS.UPDATE_APPOINTMENT),
  AppointmentController.cancelAppointment
);

// Complete appointment
router.post(
  '/:id/complete',
  appointmentValidation.completeAppointment,
  validate,
  checkPermission(PERMISSIONS.COMPLETE_APPOINTMENT),
  AppointmentController.completeAppointment
);

// Reschedule appointment
router.post(
  '/:id/reschedule',
  appointmentValidation.rescheduleAppointment,
  validate,
  checkPermission(PERMISSIONS.UPDATE_APPOINTMENT),
  AppointmentController.rescheduleAppointment
);

// ==================== LEAD-SPECIFIC ENDPOINTS ====================

// Get appointments by lead
router.get(
  '/lead/:leadId',
  appointmentValidation.getAppointmentsByLead,
  validate,
  checkPermission(PERMISSIONS.READ_APPOINTMENT),
  AppointmentController.getAppointmentsByLead
);

module.exports = router;