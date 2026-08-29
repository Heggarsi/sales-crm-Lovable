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
    const { page, limit, leadStatusId, sourceId, leadTypeId, search, serviceRequiredId, assignedToUserId, sortBy, sortOrder } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      leadStatusId,
      sourceId,
      leadTypeId,
      search,
      serviceRequiredId,
      assignedToUserId,
      sortBy,
      sortOrder
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

  // ==================== LEAD CONVERSION ====================

  // Convert lead to Account, Contact, and optionally Deal
  convertLead: asyncHandler(async (req, res) => {
    const result = await LeadService.convertLead(req.params.id, req.body, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: {
        accountId: result.accountId,
        contactId: result.contactId,
        dealId: result.dealId
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

  // Get lead services
  getLeadServices: asyncHandler(async (req, res) => {
    const services = await LeadService.getLeadServices();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead services retrieved successfully',
      data: services
    });
  }),

  // Get lead follow-up types
  getLeadFollowUpTypes: asyncHandler(async (req, res) => {
    const types = await LeadService.getLeadFollowUpTypes();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lead follow-up types retrieved successfully',
      data: types
    });
  }),

  // ==================== LEAD FOLLOW-UP CRUD ====================

  // Get all follow-ups for a lead
  getLeadFollowUps: asyncHandler(async (req, res) => {
    const followUps = await LeadService.getLeadFollowUps(req.params.id, req.user);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead follow-ups retrieved successfully', data: followUps });
  }),

  // Get single follow-up
  getFollowUpById: asyncHandler(async (req, res) => {
    const followUp = await LeadService.getFollowUpById(req.params.id, req.params.followUpId, req.user);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Follow-up retrieved successfully', data: followUp });
  }),

  // Add follow-up to lead
  createLeadFollowUp: asyncHandler(async (req, res) => {
    const followUp = await LeadService.createFollowUp(req.params.id, req.body, req.user);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Follow-up added successfully', data: followUp });
  }),

  // Update follow-up
  updateLeadFollowUp: asyncHandler(async (req, res) => {
    const followUp = await LeadService.updateFollowUp(req.params.id, req.params.followUpId, req.body, req.user);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Follow-up updated successfully', data: followUp });
  }),

  // Delete follow-up
  deleteLeadFollowUp: asyncHandler(async (req, res) => {
    await LeadService.deleteFollowUp(req.params.id, req.params.followUpId, req.user);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Follow-up deleted successfully' });
  }),



  // ==================== LEAD SOURCE CRUD ====================
  getLeadSourceById: asyncHandler(async (req, res) => {
    const source = await LeadService.getLeadSourceById(req.params.sourceId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead source retrieved successfully', data: source });
  }),

  createLeadSource: asyncHandler(async (req, res) => {
    const source = await LeadService.createLeadSource(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Lead source created successfully', data: source });
  }),

  updateLeadSource: asyncHandler(async (req, res) => {
    const source = await LeadService.updateLeadSource(req.params.sourceId, req.body);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead source updated successfully', data: source });
  }),

  deleteLeadSource: asyncHandler(async (req, res) => {
    await LeadService.deleteLeadSource(req.params.sourceId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead source deleted successfully' });
  }),

  // ==================== LEAD TYPE CRUD ====================
  getLeadTypeById: asyncHandler(async (req, res) => {
    const type = await LeadService.getLeadTypeById(req.params.typeId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead type retrieved successfully', data: type });
  }),

  createLeadType: asyncHandler(async (req, res) => {
    const type = await LeadService.createLeadType(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Lead type created successfully', data: type });
  }),

  updateLeadType: asyncHandler(async (req, res) => {
    const type = await LeadService.updateLeadType(req.params.typeId, req.body);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead type updated successfully', data: type });
  }),

  deleteLeadType: asyncHandler(async (req, res) => {
    await LeadService.deleteLeadType(req.params.typeId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead type deleted successfully' });
  }),

  // ==================== LEAD STATUS CRUD ====================
  getLeadStatusById: asyncHandler(async (req, res) => {
    const status = await LeadService.getLeadStatusById(req.params.statusId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead status retrieved successfully', data: status });
  }),

  createLeadStatus: asyncHandler(async (req, res) => {
    const status = await LeadService.createLeadStatus(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Lead status created successfully', data: status });
  }),

  updateLeadStatus: asyncHandler(async (req, res) => {
    const status = await LeadService.updateLeadStatus(req.params.statusId, req.body);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead status updated successfully', data: status });
  }),

  deleteLeadStatus: asyncHandler(async (req, res) => {
    await LeadService.deleteLeadStatus(req.params.statusId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead status deleted successfully' });
  }),

  // ==================== LEAD SERVICE REQUIRED CRUD ====================
  getLeadServiceById: asyncHandler(async (req, res) => {
    const service = await LeadService.getLeadServiceById(req.params.serviceId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead service retrieved successfully', data: service });
  }),

  createLeadService: asyncHandler(async (req, res) => {
    const service = await LeadService.createLeadService(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Lead service created successfully', data: service });
  }),

  updateLeadService: asyncHandler(async (req, res) => {
    const service = await LeadService.updateLeadService(req.params.serviceId, req.body);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead service updated successfully', data: service });
  }),

  deleteLeadService: asyncHandler(async (req, res) => {
    await LeadService.deleteLeadService(req.params.serviceId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lead service deleted successfully' });
  }),

  // ==================== LEAD FOLLOW-UP TYPE CRUD ====================
  getLeadFollowUpTypeById: asyncHandler(async (req, res) => {
    const type = await LeadService.getLeadFollowUpTypeById(req.params.followUpTypeId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Follow-up type retrieved successfully', data: type });
  }),

  createLeadFollowUpType: asyncHandler(async (req, res) => {
    const type = await LeadService.createLeadFollowUpType(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Follow-up type created successfully', data: type });
  }),

  updateLeadFollowUpType: asyncHandler(async (req, res) => {
    const type = await LeadService.updateLeadFollowUpType(req.params.followUpTypeId, req.body);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Follow-up type updated successfully', data: type });
  }),

  deleteLeadFollowUpType: asyncHandler(async (req, res) => {
    await LeadService.deleteLeadFollowUpType(req.params.followUpTypeId);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Follow-up type deleted successfully' });
  }),




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