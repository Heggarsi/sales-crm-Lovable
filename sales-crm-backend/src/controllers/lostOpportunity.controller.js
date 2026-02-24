const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const LostOpportunityService = require('../services/lostOpportunityService');
const { HTTP_STATUS } = require('../config/constants');

const LostOpportunityController = {
  // Get all lost opportunities
  getAllLostOpportunities: asyncHandler(async (req, res) => {
    const { 
      page, limit, lostReason, competitorName, 
      potentialFutureOpportunity, search 
    } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      lostReason,
      competitorName,
      potentialFutureOpportunity,
      search
    };

    const result = await LostOpportunityService.getAllLostOpportunities(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost opportunities retrieved successfully',
      ...result
    });
  }),

  // Get lost opportunity by ID
  getLostOpportunityById: asyncHandler(async (req, res) => {
    const lostOpportunity = await LostOpportunityService.getLostOpportunityById(
      req.params.id,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost opportunity retrieved successfully',
      data: lostOpportunity
    });
  }),

  // Update lost opportunity
  updateLostOpportunity: asyncHandler(async (req, res) => {
    const lostOpportunity = await LostOpportunityService.updateLostOpportunity(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost opportunity updated successfully',
      data: lostOpportunity
    });
  }),

  // Delete lost opportunity
  deleteLostOpportunity: asyncHandler(async (req, res) => {
    await LostOpportunityService.deleteLostOpportunity(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost opportunity deleted successfully'
    });
  }),

  // Get lost opportunity by opportunity ID
  getLostOpportunityByOpportunityId: asyncHandler(async (req, res) => {
    const lostOpportunity = await LostOpportunityService.getLostOpportunityByOpportunityId(
      req.params.opportunityId,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost opportunity retrieved successfully',
      data: lostOpportunity
    });
  }),

  // Get loss analysis
  getLossAnalysis: asyncHandler(async (req, res) => {
    const analysis = await LostOpportunityService.getLossAnalysis(req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Loss analysis retrieved successfully',
      data: analysis
    });
  }),

  // Get loss reasons
  getLossReasons: asyncHandler(async (req, res) => {
    const reasons = LostOpportunityService.getLossReasons();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Loss reasons retrieved successfully',
      data: reasons
    });
  })
};

module.exports = LostOpportunityController;