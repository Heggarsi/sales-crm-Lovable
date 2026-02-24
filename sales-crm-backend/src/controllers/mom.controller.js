const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const MOMService = require('../services/momService');
const { HTTP_STATUS } = require('../config/constants');

const MOMController = {
  // Create MOM
  createMOM: asyncHandler(async (req, res) => {
    const mom = await MOMService.createMOM(req.body, req.user);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Minutes of Meeting created successfully',
      data: mom
    });
  }),

  // Get all MOMs
  getAllMOMs: asyncHandler(async (req, res) => {
    const { page, limit, leadId, appointmentId, status, sharedWithClient, search } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      leadId,
      appointmentId,
      status,
      sharedWithClient,
      search
    };

    const result = await MOMService.getAllMOMs(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Minutes of Meeting retrieved successfully',
      ...result
    });
  }),

  // Get MOM by ID
  getMOMById: asyncHandler(async (req, res) => {
    const mom = await MOMService.getMOMById(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Minutes of Meeting retrieved successfully',
      data: mom
    });
  }),

  // Update MOM
  updateMOM: asyncHandler(async (req, res) => {
    const mom = await MOMService.updateMOM(req.params.id, req.body, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Minutes of Meeting updated successfully',
      data: mom
    });
  }),

  // Delete MOM
  deleteMOM: asyncHandler(async (req, res) => {
    await MOMService.deleteMOM(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Minutes of Meeting deleted successfully'
    });
  }),

  // Share MOM with client
  shareWithClient: asyncHandler(async (req, res) => {
    const result = await MOMService.shareWithClient(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result.mom
    });
  }),

  // Get MOM by appointment
  getMOMByAppointment: asyncHandler(async (req, res) => {
    const mom = await MOMService.getMOMByAppointment(req.params.appointmentId, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Minutes of Meeting retrieved successfully',
      data: mom
    });
  }),

  // Get MOMs by lead
  getMOMsByLead: asyncHandler(async (req, res) => {
    const moms = await MOMService.getMOMsByLead(req.params.leadId, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Minutes of Meeting retrieved successfully',
      data: moms
    });
  })
};

module.exports = MOMController;