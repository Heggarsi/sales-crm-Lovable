const AppointmentModel = require('../models/AppointmentModel');
const AppointmentStatusModel = require('../models/AppointmentStatusModel');
const LeadModel = require('../models/LeadsModel');
const ActivityLogModel = require('../models/ActivityLogModel');
const emailService = require('../utils/emailService');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const { pool } = require('../config/database');

const AppointmentService = {
  // Create appointment
  createAppointment: async (appointmentData, user) => {
    try {
      const { LeadId, MeetingDate } = appointmentData;

      // Check if lead exists
      const lead = await LeadModel.findById(LeadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only create appointments for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Validate meeting date is in future
      const meetingDateTime = new Date(MeetingDate);
      if (meetingDateTime < new Date()) {
        throw new AppError('Meeting date must be in the future', HTTP_STATUS.BAD_REQUEST);
      }

      // **Check if lead already has an appointment on the same day**
      const startOfDay = new Date(meetingDateTime);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(meetingDateTime);
      endOfDay.setHours(23, 59, 59, 999);

      // Check if any appointment exists for a lead on the same day
      const existingAppointment = await AppointmentModel.findOne({
        LeadId,
        startOfDay,   // new params
        endOfDay
      });

      if (existingAppointment) {
        throw new AppError(
          `Lead already has an appointment on ${meetingDateTime.toDateString()}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }      

      // Create appointment
      const appointmentId = await AppointmentModel.create({
        ...appointmentData,
        CreatedByUserId: user.UserId,
        AppointmentStatusId: 1 // Scheduled
      });

      const newAppointment = await AppointmentModel.findById(appointmentId);

      // Log activity
      await ActivityLogModel.create({
        LeadId,
        ActivityTypeId: 3, // Meeting
        Subject: `Appointment Scheduled: ${appointmentData.Title}`,
        Description: `Appointment scheduled for ${MeetingDate}`,
        Direction: 'Outbound',
        ActivityDate: helpers.formatDateTimeForMySQL(),
        CreatedByUserId: user.UserId
      });

      // Send email notification to client
      if (lead.Email) {
        await emailService.sendAppointmentEmail(lead.Email, {
          title: appointmentData.Title,
          date: MeetingDate,
          duration: appointmentData.Duration,
          mode: appointmentData.Mode,
          location: appointmentData.Location
        });
      }

      logger.info('Appointment created successfully', { appointmentId, createdBy: user.UserId });

      return newAppointment;
    } catch (error) {
      logger.error('Create appointment error:', error);
      throw error;
    }
  },

  // Get all appointments
  getAllAppointments: async (filters, user) => {
    try {
      // Sales Person can only see appointments for their assigned leads
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
      }

      const result = await AppointmentModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.appointments,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all appointments error:', error);
      throw error;
    }
  },

  // Get appointment by ID
  getAppointmentById: async (appointmentId, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (appointment.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access appointments for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      return appointment;
    } catch (error) {
      logger.error('Get appointment by ID error:', error);
      throw error;
    }
  },

  // Update appointment
  updateAppointment: async (appointmentId, updateData, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (appointment.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only update appointments for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Don't allow updating completed or cancelled appointments
      if (appointment.AppointmentStatusId === 2 || appointment.AppointmentStatusId === 3) {
        throw new AppError('Cannot update completed or cancelled appointments', HTTP_STATUS.BAD_REQUEST);
      }

      await AppointmentModel.update(appointmentId, updateData);

      const updatedAppointment = await AppointmentModel.findById(appointmentId);

      logger.info('Appointment updated successfully', { appointmentId, updatedBy: user.UserId });

      return updatedAppointment;
    } catch (error) {
      logger.error('Update appointment error:', error);
      throw error;
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (appointment.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only cancel appointments for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Can't cancel already completed or cancelled appointments
      if (appointment.AppointmentStatusId === 2 || appointment.AppointmentStatusId === 3) {
        throw new AppError('Appointment is already completed or cancelled', HTTP_STATUS.BAD_REQUEST);
      }

      // Update status to Cancelled (3)
      await AppointmentModel.updateStatus(appointmentId, 3);

      // Log activity
      await ActivityLogModel.create({
        LeadId: appointment.LeadId,
        ActivityTypeId: 4, // Note
        Subject: `Appointment Cancelled: ${appointment.Title}`,
        Description: reason || 'Appointment cancelled',
        Direction: 'Internal',
        ActivityDate: helpers.formatDateTimeForMySQL(),
        CreatedByUserId: user.UserId
      });

      const updatedAppointment = await AppointmentModel.findById(appointmentId);

      logger.info('Appointment cancelled', { appointmentId, cancelledBy: user.UserId });

      return updatedAppointment;
    } catch (error) {
      logger.error('Cancel appointment error:', error);
      throw error;
    }
  },

  // Complete appointment
  completeAppointment: async (appointmentId, completionData, user) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (appointment.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only complete appointments for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Can only complete scheduled appointments
      if (appointment.AppointmentStatusId !== 1) {
        throw new AppError('Only scheduled appointments can be completed', HTTP_STATUS.BAD_REQUEST);
      }

      // Update status to Completed (2)
      await connection.query(
        'UPDATE appointment SET AppointmentStatusId = 2, UpdatedAt = NOW() WHERE AppointmentId = ?',
        [appointmentId]
      );

      // Log activity
      await connection.query(
        `INSERT INTO activitylog (
          LeadId, ActivityTypeId, Subject, Description, Direction, Duration,
          Outcome, ActivityDate, CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, 3, ?, ?, 'Completed', ?, ?, NOW(), ?, 0, NOW(), NOW())`,
        [
          appointment.LeadId,
          `Meeting Completed: ${appointment.Title}`,
          completionData.notes || 'Meeting completed successfully',
          appointment.Duration,
          completionData.outcome || 'Successful',
          user.UserId
        ]
      );

      await connection.commit();

      const updatedAppointment = await AppointmentModel.findById(appointmentId);

      logger.info('Appointment completed', { appointmentId, completedBy: user.UserId });

      return {
        appointment: updatedAppointment,
        message: 'Appointment completed successfully. You can now create Minutes of Meeting.'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Complete appointment error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId, newDate, reason, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (appointment.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only reschedule appointments for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Can only reschedule scheduled appointments
      if (appointment.AppointmentStatusId !== 1) {
        throw new AppError('Only scheduled appointments can be rescheduled', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate new date is in future
      const newDateTime = new Date(newDate);
      if (newDateTime < new Date()) {
        throw new AppError('New meeting date must be in the future', HTTP_STATUS.BAD_REQUEST);
      }

      // Update appointment
      await AppointmentModel.update(appointmentId, {
        MeetingDate: newDate,
        AppointmentStatusId: 4 // Rescheduled
      });

      // Log activity
      await ActivityLogModel.create({
        LeadId: appointment.LeadId,
        ActivityTypeId: 4, // Note
        Subject: `Appointment Rescheduled: ${appointment.Title}`,
        Description: `Rescheduled from ${appointment.MeetingDate} to ${newDate}. Reason: ${reason || 'Not specified'}`,
        Direction: 'Internal',
        ActivityDate: helpers.formatDateTimeForMySQL(),
        CreatedByUserId: user.UserId
      });

      const updatedAppointment = await AppointmentModel.findById(appointmentId);

      logger.info('Appointment rescheduled', { appointmentId, rescheduledBy: user.UserId });

      return updatedAppointment;
    } catch (error) {
      logger.error('Reschedule appointment error:', error);
      throw error;
    }
  },

  // Get appointments by lead
  getAppointmentsByLead: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access appointments for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const appointments = await AppointmentModel.getByLeadId(leadId);

      return appointments;
    } catch (error) {
      logger.error('Get appointments by lead error:', error);
      throw error;
    }
  },

  // Get appointment statuses
  getAppointmentStatuses: async () => {
    try {
      return await AppointmentStatusModel.getAll();
    } catch (error) {
      logger.error('Get appointment statuses error:', error);
      throw error;
    }
  }
};

module.exports = AppointmentService;