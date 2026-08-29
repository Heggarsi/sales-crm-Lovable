const { body, param } = require('express-validator');

const activityValidation = {
  // Log activity
  logActivity: [
    body('AppointmentId')
      .notEmpty().withMessage('Appointment ID is required')
      .isInt({ min: 1 }).withMessage('Invalid Appointment ID'),

    body('ActivityTypeId')
      .notEmpty().withMessage('Activity type is required')
      .isInt({ min: 1, max: 5 }).withMessage('Invalid Activity type'),

    body('Subject')
      .trim()
      .notEmpty().withMessage('Subject is required')
      .isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5-200 characters'),

    body('Description')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

    body('Direction')
      .optional({ checkFalsy: true })
      .isIn(['Inbound', 'Outbound', 'Internal']).withMessage('Direction must be Inbound, Outbound, or Internal'),

    body('Duration')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1-1440 minutes'),

    body('Outcome')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Outcome must not exceed 500 characters'),

    body('ActivityDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid activity date format'),

    body('ScheduledFollowUp')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid follow-up date format')
  ],

  // Update activity
  updateActivity: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid activity ID'),

    body('ActivityTypeId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 5 }).withMessage('Invalid Activity type'),

    body('Subject')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5-200 characters'),

    body('Description')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

    body('Direction')
      .optional({ checkFalsy: true })
      .isIn(['Inbound', 'Outbound', 'Internal']).withMessage('Direction must be Inbound, Outbound, or Internal'),

    body('Duration')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1-1440 minutes'),

    body('Outcome')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Outcome must not exceed 500 characters'),

    body('ActivityDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid activity date format'),

    body('ScheduledFollowUp')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid follow-up date format')
  ],

  // Get activity by ID
  getActivityById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid activity ID')
  ],

  // Delete activity
  deleteActivity: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid activity ID')
  ],

  // Get activities by appointment
  getActivitiesByAppointment: [
    param('appointmentId')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID')
  ]
};

module.exports = activityValidation;