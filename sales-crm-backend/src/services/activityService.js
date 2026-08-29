const ActivityLogModel = require('../models/ActivityLogModel');
const ActivityTypeModel = require('../models/ActivityTypeModel');
const AppointmentModel = require('../models/AppointmentModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const ActivityService = {
  // Log activity
  logActivity: async (activityData, user) => {
    try {
      const { AppointmentId } = activityData;

      // Check if appointment exists
      const appointment = await AppointmentModel.findById(AppointmentId);
      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (appointment.CreatedByUserId !== user.UserId) {
          throw new AppError('You can only log activities for appointments assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Create activity
      const activityId = await ActivityLogModel.create({
        ...activityData,
        CreatedByUserId: user.UserId
      });

      const newActivity = await ActivityLogModel.findById(activityId);

      logger.info('Activity logged successfully', { activityId, createdBy: user.UserId });

      return newActivity;
    } catch (error) {
      logger.error('Log activity error:', error);
      throw error;
    }
  },

  // Get all activities
  getAllActivities: async (filters, user) => {
    try {
      // Sales Person can only see activities for their created appointments
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.createdByUserId = user.UserId;
      }

      const result = await ActivityLogModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.activities,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all activities error:', error);
      throw error;
    }
  },

  // Get activity by ID
  getActivityById: async (activityId, user) => {
    try {
      const activity = await ActivityLogModel.findById(activityId);

      if (!activity) {
        throw new AppError('Activity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (activity.CreatedByUserId !== user.UserId) {
          throw new AppError('You can only access activities for appointments assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      return activity;
    } catch (error) {
      logger.error('Get activity by ID error:', error);
      throw error;
    }
  },

  // Update activity
  updateActivity: async (activityId, updateData, user) => {
    try {
      const activity = await ActivityLogModel.findById(activityId);

      if (!activity) {
        throw new AppError('Activity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (activity.CreatedByUserId !== user.UserId) {
          throw new AppError('You can only update activities for appointments assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      await ActivityLogModel.update(activityId, updateData);

      const updatedActivity = await ActivityLogModel.findById(activityId);

      logger.info('Activity updated successfully', { activityId, updatedBy: user.UserId });

      return updatedActivity;
    } catch (error) {
      logger.error('Update activity error:', error);
      throw error;
    }
  },

  // Delete activity
  deleteActivity: async (activityId, user) => {
    try {
      const activity = await ActivityLogModel.findById(activityId);

      if (!activity) {
        throw new AppError('Activity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (activity.CreatedByUserId !== user.UserId) {
          throw new AppError('You can only delete activities for appointments assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      await ActivityLogModel.delete(activityId);

      logger.info('Activity deleted successfully', { activityId, deletedBy: user.UserId });

      return true;
    } catch (error) {
      logger.error('Delete activity error:', error);
      throw error;
    }
  },

  // Get activities by appointment
  getActivitiesByAppointment: async (appointmentId, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (appointment.CreatedByUserId !== user.UserId) {
          throw new AppError('You can only access activities for appointments assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const activities = await ActivityLogModel.getByAppointmentId(appointmentId);

      return activities;
    } catch (error) {
      logger.error('Get activities by appointment error:', error);
      throw error;
    }
  },

  // Get activity types
  getActivityTypes: async () => {
    try {
      return await ActivityTypeModel.getAll();
    } catch (error) {
      logger.error('Get activity types error:', error);
      throw error;
    }
  },

  // Get upcoming follow-ups
  getUpcomingFollowUps: async (user, days = 7) => {
    try {
      const followUps = await ActivityLogModel.getUpcomingFollowUps(user.UserId, days);

      return followUps;
    } catch (error) {
      logger.error('Get upcoming follow-ups error:', error);
      throw error;
    }
  }
};

module.exports = ActivityService;