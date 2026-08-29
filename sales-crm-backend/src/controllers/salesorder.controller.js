const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const SalesOrderService = require('../services/salesOrderService');
const { HTTP_STATUS } = require('../config/constants');

const SalesOrderController = {
  // Create sales order
  createOrder: asyncHandler(async (req, res) => {
    const order = await SalesOrderService.createOrder(req.body, req.user);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Sales order created successfully',
      data: order
    });
  }),

  // Get all sales orders
  getAllOrders: asyncHandler(async (req, res) => {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      dealId: req.query.dealId,
      proposalId: req.query.proposalId,
      paymentStatusId: req.query.paymentStatusId,
      deliveryStatusId: req.query.deliveryStatusId,
      createdBy: req.query.createdBy,
      search: req.query.search
    };

    const result = await SalesOrderService.getAllOrders(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Sales orders retrieved successfully',
      ...result
    });
  }),

  // Get sales order by ID
  getOrderById: asyncHandler(async (req, res) => {
    const order = await SalesOrderService.getOrderById(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Sales order retrieved successfully',
      data: order
    });
  }),

  // Update sales order
  updateOrder: asyncHandler(async (req, res) => {
    const order = await SalesOrderService.updateOrder(req.params.id, req.body, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Sales order updated successfully',
      data: order
    });
  }),

  // Delete sales order
  deleteOrder: asyncHandler(async (req, res) => {
    await SalesOrderService.deleteOrder(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Sales order deleted successfully'
    });
  }),

  // Get lookups for sales orders
  getLookups: asyncHandler(async (req, res) => {
    const lookups = await SalesOrderService.getLookups();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lookups retrieved successfully',
      data: lookups
    });
  })
};

module.exports = SalesOrderController;
