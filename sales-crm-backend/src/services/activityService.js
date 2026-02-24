const ActivityLogModel = require('../models/ActivityLogModel');
const ActivityTypeModel = require('../models/ActivityTypeModel');
const LeadModel = require('../models/LeadsModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const ActivityService = {
  // Log activity
  logActivity: async (activityData, user) => {
    try {
      const { LeadId } = activityData;

      // Check if lead exists
      const lead = await LeadModel.findById(LeadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only log activities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
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
      // Sales Person can only see activities for their assigned leads
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
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
        if (activity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access activities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
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
        if (activity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only update activities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
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
        if (activity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only delete activities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
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

  // Get activities by lead
  getActivitiesByLead: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access activities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const activities = await ActivityLogModel.getByLeadId(leadId);

      return activities;
    } catch (error) {
      logger.error('Get activities by lead error:', error);
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