const { body, param } = require('express-validator');

const momValidation = {
  // Create MOM
  createMOM: [
    body('AppointmentId')
      .notEmpty().withMessage('Appointment ID is required')
      .isInt({ min: 1 }).withMessage('Invalid Appointment ID'),
    
    body('LeadId')
      .notEmpty().withMessage('Lead ID is required')
      .isInt({ min: 1 }).withMessage('Invalid Lead ID'),
    
    body('MeetingDate')
      .notEmpty().withMessage('Meeting date is required')
      .isISO8601().withMessage('Invalid date format'),
    
    body('Attendees')
      .notEmpty().withMessage('Attendees are required')
      .trim()
      .isLength({ min: 5, max: 1000 }).withMessage('Attendees must be between 5-1000 characters'),
    
    body('DiscussionPoints')
      .notEmpty().withMessage('Discussion points are required')
      .trim()
      .isLength({ min: 10 }).withMessage('Discussion points must be at least 10 characters'),
    
    body('Decisions')
      .optional()
      .trim(),
    
    body('ActionItems')
      .optional()
      .trim(),
    
    body('NextSteps')
      .optional()
      .trim(),
    
    body('FollowUpDate')
      .optional()
      .isISO8601().withMessage('Invalid follow-up date format'),
    
    body('ClientFeedback')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Client feedback must not exceed 2000 characters'),
    
    body('InternalNotes')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Internal notes must not exceed 2000 characters'),
    
    body('Status')
      .optional()
      .isIn(['Draft', 'Final', 'Reviewed', 'Shared']).withMessage('Invalid status')
  ],

  // Update MOM
  updateMOM: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid MOM ID'),
    
    body('MeetingDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    
    body('Attendees')
      .optional()
      .trim()
      .isLength({ min: 5, max: 1000 }).withMessage('Attendees must be between 5-1000 characters'),
    
    body('DiscussionPoints')
      .optional()
      .trim()
      .isLength({ min: 10 }).withMessage('Discussion points must be at least 10 characters'),
    
    body('Decisions')
      .optional()
      .trim(),
    
    body('ActionItems')
      .optional()
      .trim(),
    
    body('NextSteps')
      .optional()
      .trim(),
    
    body('FollowUpDate')
      .optional()
      .isISO8601().withMessage('Invalid follow-up date format'),
    
    body('ClientFeedback')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Client feedback must not exceed 2000 characters'),
    
    body('InternalNotes')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Internal notes must not exceed 2000 characters'),
    
    body('Status')
      .optional()
      .isIn(['Draft', 'Final', 'Reviewed', 'Shared']).withMessage('Invalid status')
  ],

  // Get MOM by ID
  getMOMById: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid MOM ID')
  ],

  // Delete MOM
  deleteMOM: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid MOM ID')
  ],

  // Share with client
  shareWithClient: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid MOM ID')
  ],

  // Get MOM by appointment
  getMOMByAppointment: [
    param('appointmentId')
      .isInt({ min: 1 }).withMessage('Invalid appointment ID')
  ],

  // Get MOMs by lead
  getMOMsByLead: [
    param('leadId')
      .isInt({ min: 1 }).withMessage('Invalid lead ID')
  ]
};

module.exports = momValidation;