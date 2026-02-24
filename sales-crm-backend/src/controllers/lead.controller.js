const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const LeadService = require('../services/leadService');
const { HTTP_STATUS } = require('../config/constants');

const LeadController = {
  // ==================== BASIC LEAD CRUD ====================
  
  // Create lead
  createLead: asyncHandler(async (req, res) => {
    const lead = await LeadService.createLead(req.body, req.user.UserId);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  }),

  // Get all leads
  getAllLeads: asyncHandler(async (req, res) => {
    const { page, limit, leadStatusId, sourceId, leadTypeId, search } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      leadStatusId,
      sourceId,
      leadTypeId,
      search
    };

    const result = await LeadService.getAllLeads(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Leads retrieved successfully',
      ...result
    });
  }),

  // Get lead by ID
  getLeadById: asyncHandler(async (req, res) => {
    const lead = await LeadService.getLeadById(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead retrieved successfully',
      data: lead
    });
  }),

  // Update lead
  updateLead: asyncHandler(async (req, res) => {
    const lead = await LeadService.updateLead(req.params.id, req.body, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  }),

  // Delete lead
  deleteLead: asyncHandler(async (req, res) => {
    await LeadService.deleteLead(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  }),

  // Assign lead to sales person
  assignLead: asyncHandler(async (req, res) => {
    const { assignedToUserId } = req.body;
    const lead = await LeadService.assignLead(req.params.id, assignedToUserId, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead assigned successfully',
      data: lead
    });
  }),

  // ==================== QUALIFICATION MODULE ====================

  // Get qualification details (Lead + Business Info)
  getQualificationDetails: asyncHandler(async (req, res) => {
    const details = await LeadService.getQualificationDetails(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Qualification details retrieved successfully',
      data: details
    });
  }),

  // Add or update business info
  addOrUpdateBusinessInfo: asyncHandler(async (req, res) => {
    const businessInfo = await LeadService.addOrUpdateBusinessInfo(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Business information saved successfully',
      data: businessInfo
    });
  }),

  // Accept qualification (Qualified)
  acceptQualification: asyncHandler(async (req, res) => {
    const result = await LeadService.acceptQualification(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: {
        lead: result.lead,
        qualification: result.qualification
      }
    });
  }),

  // Reject qualification (Unqualified)
  rejectQualification: asyncHandler(async (req, res) => {
    const result = await LeadService.rejectQualification(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: {
        lead: result.lead
      }
    });
  }),

  // ==================== HELPER ENDPOINTS ====================

  // Send introduction email
  sendIntroEmail: asyncHandler(async (req, res) => {
    const result = await LeadService.sendIntroEmail(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message
    });
  }),

  // Get lead sources
  getLeadSources: asyncHandler(async (req, res) => {
    const sources = await LeadService.getLeadSources();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead sources retrieved successfully',
      data: sources
    });
  }),

  // Get lead types
  getLeadTypes: asyncHandler(async (req, res) => {
    const types = await LeadService.getLeadTypes();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead types retrieved successfully',
      data: types
    });
  }),

  // Get lead statuses
  getLeadStatuses: asyncHandler(async (req, res) => {
    const statuses = await LeadService.getLeadStatuses();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead statuses retrieved successfully',
      data: statuses
    });
  }),

  // Get Qualification statuses
  getQualificationStatuses: asyncHandler(async (req, res) => {
    const statuses = await LeadService.getQualificationStatuses();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Qualification statuses retrieved successfully',
      data: statuses
    });
  })
  
};

module.exports = LeadController;



 // // Get lead statistics
  // getLeadStatistics: asyncHandler(async (req, res) => {
  //   const statistics = await LeadService.getLeadStatistics(req.user);

  //   res.status(HTTP_STATUS.OK).json({
  //     success: true,
  //     message: 'Lead statistics retrieved successfully',
  //     data: statistics
  //   });
  // })