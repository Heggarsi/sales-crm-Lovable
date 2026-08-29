const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const ActivityService = require('../services/activityService');
const { HTTP_STATUS } = require('../config/constants');
const ActivityController = {
  // Log activity
  logActivity: asyncHandler(async (req, res) => {
    const activity = await ActivityService.logActivity(req.body, req.user);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Activity logged successfully',
      data: activity
    });
  }),
  // Get all activities
  getAllActivities: asyncHandler(async (req, res) => {
    const { page, limit, appointmentId, activityTypeId, fromDate, toDate, search } = req.query;
    const filters = {
      page: page || 1,
      limit: limit || 10,
      appointmentId,
      activityTypeId,
      fromDate,
      toDate,
      search
    };
    const result = await ActivityService.getAllActivities(filters, req.user);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Activities retrieved successfully',
      ...result
    });
  }),
  // Get activity by ID
  getActivityById: asyncHandler(async (req, res) => {
    const activity = await ActivityService.getActivityById(req.params.id, req.user);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Activity retrieved successfully',
      data: activity
    });
  }),
  // Update activity
  updateActivity: asyncHandler(async (req, res) => {
    const activity = await ActivityService.updateActivity(
      req.params.id,
      req.body,
      req.user
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Activity updated successfully',
      data: activity
    });
  }),
  // Delete activity
  deleteActivity: asyncHandler(async (req, res) => {
    await ActivityService.deleteActivity(req.params.id, req.user);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  }),
  // Get activities by appointment
  getActivitiesByAppointment: asyncHandler(async (req, res) => {
    const activities = await ActivityService.getActivitiesByAppointment(
      req.params.appointmentId,
      req.user
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Activities retrieved successfully',
      data: activities
    });
  }),
  // Get activity types
  getActivityTypes: asyncHandler(async (req, res) => {
    const types = await ActivityService.getActivityTypes();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Activity types retrieved successfully',
      data: types
    });
  }),
  // Get upcoming follow-ups
  getUpcomingFollowUps: asyncHandler(async (req, res) => {
    const { days } = req.query;
    const followUps = await ActivityService.getUpcomingFollowUps(req.user, days);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Upcoming follow-ups retrieved successfully',
      data: followUps
    });
  })
};
module.exports = ActivityController;