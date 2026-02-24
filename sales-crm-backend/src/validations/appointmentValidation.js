const { body, param, query } = require('express-validator');

const appointmentValidation = {
  // Create appointment
  createAppointment: [
    body('LeadId')
      .notEmpty().withMessage('Lead ID is required')
      .isInt({ min: 1 }).withMessage('Invalid Lead ID'),
    
    body('Title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5-200 characters'),
    
    body('MeetingDate')
      .notEmpty().withMessage('Meeting date is required')
      .isISO8601().withMessage('Invalid date format'),
    
    body('Duration')
      .notEmpty().withMessage('Duration is required')
      .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15-480 minutes'),
    
    body('Mode')
      .notEmpty().withMessage('Mode is required')
      .isIn(['Online', 'Offline']).withMessage('Mode must be either Online or Offline'),
    
    body('Location')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Location must not exceed 500 characters'),
    
    body('Agenda')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Agenda must not exceed 2000 characters'),
    
    body('AttendeesList')
      .optional()
  ],

  // Update appointment
  updateAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID'),
    
    body('Title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5-200 characters'),
    
    body('MeetingDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    
    body('Duration')
      .optional()
      .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15-480 minutes'),
    
    body('Mode')
      .optional()
      .isIn(['Online', 'Offline']).withMessage('Mode must be either Online or Offline'),
    
    body('Location')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Location must not exceed 500 characters'),
    
    body('Agenda')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Agenda must not exceed 2000 characters')
  ],

  // Get appointment by ID
  getAppointmentById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID')
  ],

  // Delete appointment
  deleteAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID')
  ],

  // Cancel appointment
  cancelAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID'),
    
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
  ],

  // Complete appointment
  completeAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
    
    body('outcome')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Outcome must not exceed 200 characters')
  ],

  // Reschedule appointment
  rescheduleAppointment: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID'),
    
    body('newDate')
      .notEmpty().withMessage('New date is required')
      .isISO8601().withMessage('Invalid date format'),
    
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
  ],

  // Get appointments by lead
  getAppointmentsByLead: [
    param('leadId')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ]
};

module.exports = appointmentValidation;