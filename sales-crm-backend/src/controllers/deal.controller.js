const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const DealService = require('../services/dealService');
const { HTTP_STATUS } = require('../config/constants');

const DealController = {
  createDeal: asyncHandler(async (req, res) => {
    const deal = await DealService.createDeal(req.body, req.user.UserId);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Deal created successfully',
      data: deal
    });
  }),

  getAllDeals: asyncHandler(async (req, res) => {
    const result = await DealService.getAllDeals(req.query, req.user);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deals retrieved successfully',
      ...result
    });
  }),

  getDealById: asyncHandler(async (req, res) => {
    const deal = await DealService.getDealById(req.params.id, req.user);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deal retrieved successfully',
      data: deal
    });
  }),

  updateDeal: asyncHandler(async (req, res) => {
    const deal = await DealService.updateDeal(req.params.id, req.body, req.user);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deal updated successfully',
      data: deal
    });
  }),

  deleteDeal: asyncHandler(async (req, res) => {
    await DealService.deleteDeal(req.params.id, req.user);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deal deleted successfully'
    });
  }),

  getDealStages: asyncHandler(async (req, res) => {
    const stages = await DealService.getDealStages();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deal stages retrieved successfully',
      data: stages
    });
  }),

  getDealStageById: asyncHandler(async (req, res) => {
    const stage = await DealService.getDealStageById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deal stage retrieved successfully',
      data: stage
    });
  }),

  createDealStage: asyncHandler(async (req, res) => {
    const stage = await DealService.createDealStage(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Deal stage created successfully',
      data: stage
    });
  }),

  updateDealStage: asyncHandler(async (req, res) => {
    const stage = await DealService.updateDealStage(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deal stage updated successfully',
      data: stage
    });
  }),

  deleteDealStage: asyncHandler(async (req, res) => {
    await DealService.deleteDealStage(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Deal stage deleted successfully'
    });
  })
};

module.exports = DealController;
