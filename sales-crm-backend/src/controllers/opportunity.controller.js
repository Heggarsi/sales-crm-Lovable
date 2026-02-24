const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const OpportunityService = require('../services/opportunityService');
const LostOpportunityService = require('../services/lostOpportunityService');
const { HTTP_STATUS } = require('../config/constants');

const OpportunityController = {
  // ==================== BASIC OPPORTUNITY CRUD ====================

  // Create opportunity
  createOpportunity: asyncHandler(async (req, res) => {
    const opportunity = await OpportunityService.createOpportunity(req.body, req.user);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Opportunity created successfully',
      data: opportunity
    });
  }),

  // Bulk create opportunities from qualified leads
  bulkCreateOpportunitiesFromQualifiedLeads: asyncHandler(async (req, res) => {
    const result = await OpportunityService.bulkCreateOpportunitiesFromQualifiedLeads(req.user);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: result.message,
      data: result
    });
  }),

  // Get all opportunities
  getAllOpportunities: asyncHandler(async (req, res) => {
    const { 
      page, limit, leadId, opportunityStageId, opportunityStatusId, 
      minValue, maxValue, search 
    } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      leadId,
      opportunityStageId,
      opportunityStatusId,
      minValue,
      maxValue,
      search
    };

    const result = await OpportunityService.getAllOpportunities(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunities retrieved successfully',
      ...result
    });
  }),

  // Get opportunity by ID
  getOpportunityById: asyncHandler(async (req, res) => {
    const opportunity = await OpportunityService.getOpportunityById(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunity retrieved successfully',
      data: opportunity
    });
  }),

  // Update opportunity
  updateOpportunity: asyncHandler(async (req, res) => {
    const opportunity = await OpportunityService.updateOpportunity(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunity updated successfully',
      data: opportunity
    });
  }),

  // Delete opportunity
  deleteOpportunity: asyncHandler(async (req, res) => {
    await OpportunityService.deleteOpportunity(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  }),

  // ==================== OPPORTUNITY ACTIONS ====================

  // Update stage
  updateStage: asyncHandler(async (req, res) => {
    const { stageId } = req.body;
    const opportunity = await OpportunityService.updateStage(
      req.params.id,
      stageId,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunity stage updated successfully',
      data: opportunity
    });
  }),

  // Win opportunity
  winOpportunity: asyncHandler(async (req, res) => {
    const result = await OpportunityService.winOpportunity(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result
    });
  }),

  // Lose opportunity
  loseOpportunity: asyncHandler(async (req, res) => {
    const result = await LostOpportunityService.loseOpportunity(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result
    });
  }),

  // ==================== LEAD-SPECIFIC ENDPOINTS ====================

  // Get opportunities by lead
  getOpportunitiesByLead: asyncHandler(async (req, res) => {
    const opportunities = await OpportunityService.getOpportunitiesByLead(
      req.params.leadId,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunities retrieved successfully',
      data: opportunities
    });
  }),

  // ==================== ADVANCED FEATURES ====================

  // Get pipeline view
  getPipeline: asyncHandler(async (req, res) => {
    const pipeline = await OpportunityService.getPipeline(req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Pipeline retrieved successfully',
      data: pipeline
    });
  }),

  // Get forecast
  getForecast: asyncHandler(async (req, res) => {
    const forecast = await OpportunityService.getForecast(req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Forecast retrieved successfully',
      data: forecast
    });
  }),

  // Get qualified leads without opportunities
  getQualifiedLeadsWithoutOpportunity: asyncHandler(async (req, res) => {
    const leads = await OpportunityService.getQualifiedLeadsWithoutOpportunity(req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Qualified leads without opportunities retrieved successfully',
      data: leads,
      count: leads.length
    });
  }),

  // Generate opportunity report
  generateOpportunityReport: asyncHandler(async (req, res) => {
    const { startDate, endDate, stageId, statusId } = req.query;

    const filters = {
      startDate,
      endDate,
      stageId,
      statusId
    };

    const report = await OpportunityService.generateOpportunityReport(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunity report generated successfully',
      data: report
    });
  }),

  // ==================== HELPER ENDPOINTS ====================

  // Get opportunity stages
  getOpportunityStages: asyncHandler(async (req, res) => {
    const stages = await OpportunityService.getOpportunityStages();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunity stages retrieved successfully',
      data: stages
    });
  }),

  // Get opportunity statuses
  getOpportunityStatuses: asyncHandler(async (req, res) => {
    const statuses = await OpportunityService.getOpportunityStatuses();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Opportunity statuses retrieved successfully',
      data: statuses
    });
  })
};

module.exports = OpportunityController;