const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const LostOrderService = require('../services/lostOrderService');
const { HTTP_STATUS } = require('../config/constants');

const LostOrderController = {
  // Get all lost orders
  getAllLostOrders: asyncHandler(async (req, res) => {
    const { page, limit, reason, competitorWon, search } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      reason,
      competitorWon,
      search
    };

    const result = await LostOrderService.getAllLostOrders(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost orders retrieved successfully',
      ...result
    });
  }),

  // Get lost order by ID
  getLostOrderById: asyncHandler(async (req, res) => {
    const lostOrder = await LostOrderService.getLostOrderById(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost order retrieved successfully',
      data: lostOrder
    });
  }),

  // Update lost order
  updateLostOrder: asyncHandler(async (req, res) => {
    const lostOrder = await LostOrderService.updateLostOrder(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost order updated successfully',
      data: lostOrder
    });
  }),

  // Delete lost order
  deleteLostOrder: asyncHandler(async (req, res) => {
    await LostOrderService.deleteLostOrder(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost order deleted successfully'
    });
  }),

  // Get lost order by proposal ID
  getLostOrderByProposalId: asyncHandler(async (req, res) => {
    const lostOrder = await LostOrderService.getLostOrderByProposalId(
      req.params.proposalId,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lost order retrieved successfully',
      data: lostOrder
    });
  }),

  // Get loss analysis
  getLossAnalysis: asyncHandler(async (req, res) => {
    const analysis = await LostOrderService.getLossAnalysis(req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Loss analysis retrieved successfully',
      data: analysis
    });
  })
};

module.exports = LostOrderController;