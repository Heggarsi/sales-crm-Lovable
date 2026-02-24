const MinutesOfMeetingModel = require('../models/MinutesOfMeetingModel');
const AppointmentModel = require('../models/AppointmentModel');
const LeadModel = require('../models/LeadsModel');
const emailService = require('../utils/emailService');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const MOMService = {
  // Create MOM
  createMOM: async (momData, user) => {
    try {
      const { AppointmentId, LeadId } = momData;

      // Check if appointment exists
      const appointment = await AppointmentModel.findById(AppointmentId);
      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check if lead exists
      const lead = await LeadModel.findById(LeadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only create MOM for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Check if appointment is completed
      const isCompleted = await AppointmentModel.isCompleted(AppointmentId);
      if (!isCompleted) {
        throw new AppError('MOM can only be created for completed appointments', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if MOM already exists for this appointment
      const existingMOM = await MinutesOfMeetingModel.findByAppointmentId(AppointmentId);
      if (existingMOM) {
        throw new AppError('Minutes of Meeting already exists for this appointment', HTTP_STATUS.CONFLICT);
      }

      // Create MOM
      const momId = await MinutesOfMeetingModel.create({
        ...momData,
        PreparedByUserId: user.UserId,
        Status: momData.Status || 'Draft'
      });

      const newMOM = await MinutesOfMeetingModel.findById(momId);

      logger.info('MOM created successfully', { momId, createdBy: user.UserId });

      return newMOM;
    } catch (error) {
      logger.error('Create MOM error:', error);
      throw error;
    }
  },

  // Get all MOMs
  getAllMOMs: async (filters, user) => {
    try {
      // Sales Person can only see MOMs for their assigned leads
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
      }

      const result = await MinutesOfMeetingModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.moms,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all MOMs error:', error);
      throw error;
    }
  },

  // Get MOM by ID
  getMOMById: async (momId, user) => {
    try {
      const mom = await MinutesOfMeetingModel.findById(momId);

      if (!mom) {
        throw new AppError('Minutes of Meeting not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (mom.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access MOM for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      return mom;
    } catch (error) {
      logger.error('Get MOM by ID error:', error);
      throw error;
    }
  },

  // Update MOM
  updateMOM: async (momId, updateData, user) => {
    try {
      const mom = await MinutesOfMeetingModel.findById(momId);
  
      if (!mom) {
        throw new AppError('Minutes of Meeting not found', HTTP_STATUS.NOT_FOUND);
      }
  
      // Ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (mom.AssignedToUserId !== user.UserId) {
          throw new AppError(
            'You can only update MOM for leads assigned to you',
            HTTP_STATUS.FORBIDDEN
          );
        }
      }
  
      // ✅ Business invariant
      if (
        updateData.Status === 'Reviewed' &&
        !updateData.ReviewedByUserId &&
        !mom.ReviewedByUserId
      ) {
        throw new AppError(
          'ReviewedByUserId is required when status is Reviewed',
          HTTP_STATUS.BAD_REQUEST
        );
      }
  
      // 🧹 Auto-clean (industry style)
      if (updateData.Status && updateData.Status !== 'Reviewed') {
        delete updateData.ReviewedByUserId;
      }
  
      await MinutesOfMeetingModel.update(momId, updateData);
  
      const updatedMOM = await MinutesOfMeetingModel.findById(momId);
  
      logger.info('MOM updated successfully', {
        momId,
        updatedBy: user.UserId
      });
  
      return updatedMOM;
    } catch (error) {
      logger.error('Update MOM error:', error);
      throw error;
    }
  },
  

  // Delete MOM
  deleteMOM: async (momId, user) => {
    try {
      const mom = await MinutesOfMeetingModel.findById(momId);

      if (!mom) {
        throw new AppError('Minutes of Meeting not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (mom.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only delete MOM for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      await MinutesOfMeetingModel.delete(momId);

      logger.info('MOM deleted successfully', { momId, deletedBy: user.UserId });

      return true;
    } catch (error) {
      logger.error('Delete MOM error:', error);
      throw error;
    }
  },

  // Share MOM with client
  shareWithClient: async (momId, user) => {
    try {
      const mom = await MinutesOfMeetingModel.findById(momId);

      if (!mom) {
        throw new AppError('Minutes of Meeting not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (mom.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only share MOM for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Get lead details
      const lead = await LeadModel.findById(mom.LeadId);
      if (!lead || !lead.Email) {
        throw new AppError('Lead email not found', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if already shared
      if (mom.SharedWithClient) {
        throw new AppError('MOM has already been shared with client', HTTP_STATUS.BAD_REQUEST);
      }

      // Send email (you can customize this)
      // await emailService.sendMOMEmail(lead.Email, mom);

      // Mark as shared
      await MinutesOfMeetingModel.markAsShared(momId);

      const updatedMOM = await MinutesOfMeetingModel.findById(momId);

      logger.info('MOM shared with client', { momId, sharedBy: user.UserId });

      return {
        mom: updatedMOM,
        message: 'Minutes of Meeting shared with client successfully'
      };
    } catch (error) {
      logger.error('Share MOM with client error:', error);
      throw error;
    }
  },

  // Get MOM by appointment
  getMOMByAppointment: async (appointmentId, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (appointment.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access MOM for appointments of leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const mom = await MinutesOfMeetingModel.findByAppointmentId(appointmentId);

      if (!mom) {
        throw new AppError('Minutes of Meeting not found for this appointment', HTTP_STATUS.NOT_FOUND);
      }

      return mom;
    } catch (error) {
      logger.error('Get MOM by appointment error:', error);
      throw error;
    }
  },

  // Get MOMs by lead
  getMOMsByLead: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access MOMs for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const moms = await MinutesOfMeetingModel.getByLeadId(leadId);

      return moms;
    } catch (error) {
      logger.error('Get MOMs by lead error:', error);
      throw error;
    }
  }
};

module.exports = MOMService;