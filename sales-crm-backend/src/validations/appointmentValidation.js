const { body, param, query } = require('express-validator');

const appointmentValidation = {

  // ─── Create Appointment ───────────────────────────────────────────────────
  createAppointment: [
    // At least one relation must be provided
    body()
      .custom((_, { req }) => {
        const { LeadId, ContactId, AccountId, DealId } = req.body;
        if (!LeadId && !ContactId && !AccountId && !DealId) {
          throw new Error('At least one relation (LeadId, ContactId, AccountId, or DealId) is required');
        }
        return true;
      }),

    body('LeadId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid Lead ID'),

    body('ContactId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid Contact ID'),

    body('AccountId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid Account ID'),

    body('DealId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid Deal ID'),

    body('Title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5-200 characters'),

    body('Agenda')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 2000 }).withMessage('Agenda must not exceed 2000 characters'),

    body('MeetingNotes')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 5000 }).withMessage('Meeting notes must not exceed 5000 characters'),

    body('StartDateTime')
      .notEmpty().withMessage('Start date/time is required')
      .isISO8601().withMessage('Invalid StartDateTime format'),

    body('EndDateTime')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid EndDateTime format')
      .custom((endDateTime, { req }) => {
        if (endDateTime && req.body.StartDateTime) {
          if (new Date(endDateTime) <= new Date(req.body.StartDateTime)) {
            throw new Error('EndDateTime must be after StartDateTime');
          }
        }
        return true;
      }),

    body('Duration')
      .optional({ checkFalsy: true })
      .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15-480 minutes'),

    body('Mode')
      .notEmpty().withMessage('Mode is required')
      .isIn(['Online', 'Offline', 'Phone']).withMessage('Mode must be Online, Offline, or Phone'),

    body('Location')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Location must not exceed 500 characters'),

    body('MeetingLink')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value, { req }) => {
        if (
          (req.body.Mode === 'Phone' || req.body.Mode === 'Offline') &&
          value
        ) {
          throw new Error('MeetingLink is allowed only for Online meetings');
        }
        return true;
      })
      .isURL().withMessage('MeetingLink must be a valid URL')
      .isLength({ max: 500 }).withMessage('MeetingLink must not exceed 500 characters'),

    body('Outcome')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Outcome must not exceed 100 characters'),

    body('NextFollowUpDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid NextFollowUpDate format'),

    body('FollowUpNotes')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 2000 }).withMessage('Follow-up notes must not exceed 2000 characters'),

    body('AttendeesList')
      .optional({ checkFalsy: true }),

    body('ReminderEnabled')
      .optional({ checkFalsy: true })
      .isBoolean().withMessage('ReminderEnabled must be true or false'),

    body('ReminderMinutesBefore')
      .optional({ checkFalsy: true })
      .isInt({ min: 5, max: 10080 }).withMessage('Reminder must be between 5 and 10080 minutes (7 days)')
      .custom((val, { req }) => {
        if (val !== undefined && !req.body.ReminderEnabled) {
          throw new Error('ReminderEnabled must be true to set ReminderMinutesBefore');
        }
        return true;
      })
  ],

  // ─── Update Appointment ───────────────────────────────────────────────────
  updateAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID'),

    body('LeadId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid Lead ID'),

    body('ContactId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid Contact ID'),

    body('AccountId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid Account ID'),

    body('DealId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Invalid Deal ID'),

    body('Title')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5-200 characters'),

    body('Agenda')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 2000 }).withMessage('Agenda must not exceed 2000 characters'),

    body('MeetingNotes')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 5000 }).withMessage('Meeting notes must not exceed 5000 characters'),

    body('StartDateTime')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid StartDateTime format'),

    body('EndDateTime')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid EndDateTime format')
      .custom((endDateTime, { req }) => {
        if (endDateTime && req.body.StartDateTime) {
          if (new Date(endDateTime) <= new Date(req.body.StartDateTime)) {
            throw new Error('EndDateTime must be after StartDateTime');
          }
        }
        return true;
      }),

    body('Duration')
      .optional({ checkFalsy: true })
      .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15-480 minutes'),

    body('Mode')
      .optional({ checkFalsy: true })
      .isIn(['Online', 'Offline', 'Phone']).withMessage('Mode must be Online, Offline, or Phone'),

    body('Location')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Location must not exceed 500 characters'),

    body('MeetingLink')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value, { req }) => {
        if (
          (req.body.Mode === 'Phone' || req.body.Mode === 'Offline') &&
          value
        ) {
          throw new Error('MeetingLink is allowed only for Online meetings');
        }
        return true;
      })
      .isURL().withMessage('MeetingLink must be a valid URL')
      .isLength({ max: 500 }).withMessage('MeetingLink must not exceed 500 characters'),

    body('Outcome')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Outcome must not exceed 100 characters'),

    body('NextFollowUpDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Invalid NextFollowUpDate format'),

    body('FollowUpNotes')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 2000 }).withMessage('Follow-up notes must not exceed 2000 characters'),

    body('AttendeesList')
      .optional({ checkFalsy: true }),

    body('ReminderEnabled')
      .optional({ checkFalsy: true })
      .isBoolean().withMessage('ReminderEnabled must be true or false'),

    body('ReminderMinutesBefore')
      .optional({ checkFalsy: true })
      .isInt({ min: 5, max: 10080 }).withMessage('Reminder must be between 5 and 10080 minutes (7 days)')
  ],

  // ─── Get Appointment by ID ────────────────────────────────────────────────
  getAppointmentById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID')
  ],

  // ─── Delete Appointment ───────────────────────────────────────────────────
  deleteAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID')
  ],

  // ─── Cancel Appointment ───────────────────────────────────────────────────
  cancelAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID'),

    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
  ],

  // ─── Complete Appointment ─────────────────────────────────────────────────
  completeAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID'),

    body('MeetingNotes')
      .optional()
      .trim()
      .isLength({ max: 5000 }).withMessage('Meeting notes must not exceed 5000 characters'),

    body('Outcome')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Outcome must not exceed 100 characters'),

    body('NextFollowUpDate')
      .optional()
      .isISO8601().withMessage('Invalid NextFollowUpDate format'),

    body('FollowUpNotes')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Follow-up notes must not exceed 2000 characters')
  ],

  // ─── Reschedule Appointment ───────────────────────────────────────────────
  rescheduleAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID'),

    body('StartDateTime')
      .notEmpty().withMessage('New StartDateTime is required')
      .isISO8601().withMessage('Invalid StartDateTime format'),

    body('EndDateTime')
      .optional()
      .isISO8601().withMessage('Invalid EndDateTime format')
      .custom((endDateTime, { req }) => {
        if (endDateTime && req.body.StartDateTime) {
          if (new Date(endDateTime) <= new Date(req.body.StartDateTime)) {
            throw new Error('EndDateTime must be after StartDateTime');
          }
        }
        return true;
      }),

    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
  ],

  // ─── Get Appointments by Lead ─────────────────────────────────────────────
  getAppointmentsByLead: [
    param('leadId')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ],

  // ─── Get Appointments by Contact ─────────────────────────────────────────
  getAppointmentsByContact: [
    param('contactId')
      .isInt({ min: 1 }).withMessage('Invalid contact ID')
  ],

  // ─── Get Appointments by Account ─────────────────────────────────────────
  getAppointmentsByAccount: [
    param('accountId')
      .isInt({ min: 1 }).withMessage('Invalid account ID')
  ],

  // ─── Get Appointments by Deal ─────────────────────────────────────────────
  getAppointmentsByDeal: [
    param('dealId')
      .isInt({ min: 1 }).withMessage('Invalid deal ID')
  ]

};

module.exports = appointmentValidation;