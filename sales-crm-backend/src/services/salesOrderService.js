const SalesOrderModel = require('../models/SalesOrderModel');
const ProposalModel = require('../models/ProposalModel');
const PaymentStatusModel = require('../models/PaymentStatusModel');
const DeliveryStatusModel = require('../models/DeliveryStatusModel');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler.middleware');

const SalesOrderService = {
  // Create sales order
  createOrder: async (orderData, user) => {
    try {
      if (!orderData.ProposalId) {
        throw new AppError('ProposalId is required for sales order creation', 400);
      }

      const proposal = await ProposalModel.findById(orderData.ProposalId);
      if (!proposal) throw new AppError('Proposal not found', 4404);

      // Check if proposal is approved
      const isApproved = await ProposalModel.isApproved(orderData.ProposalId);
      if (!isApproved) {
        throw new AppError('Only approved proposals can be converted to sales orders', 400);
      }

      // Check if proposal already has a sales order
      const alreadyConverted = await SalesOrderModel.existsByProposalId(orderData.ProposalId);
      if (alreadyConverted) {
        throw new AppError('This proposal has already been converted to a sales order', 400);
      }

      // Auto-fill from proposal if not provided
      if (!orderData.OrderValue && !orderData.OrderAmount) {
        orderData.OrderValue = proposal.ProposalAmount;
      }
      if (!orderData.Currency) orderData.Currency = proposal.Currency;

      if (orderData.OrderAmount !== undefined && orderData.OrderValue === undefined) {
        orderData.OrderValue = orderData.OrderAmount;
      }

      // Proposal is already linked to a Deal; no additional deal/opportunity lookup is required here.

      const orderId = await SalesOrderModel.create(orderData);
      return await SalesOrderModel.findById(orderId);
    } catch (error) {
      logger.error('Error in SalesOrderService.createOrder:', error);
      throw error;
    }
  },

  // Get all sales orders
  getAllOrders: async (filters, user) => {
    try {
      // For now, follow the pattern of the controller passing filters.

      const result = await SalesOrderModel.getAll(filters);
      return result;
    } catch (error) {
      logger.error('Error in SalesOrderService.getAllOrders:', error);
      throw error;
    }
  },

  // Get sales order by ID
  getOrderById: async (orderId, user) => {
    try {
      const order = await SalesOrderModel.findById(orderId);
      if (!order) throw new AppError('Sales order not found', 4404);
      return order;
    } catch (error) {
      logger.error('Error in SalesOrderService.getOrderById:', error);
      throw error;
    }
  },

  // Update sales order
  updateOrder: async (orderId, updateData, user) => {
    try {
      const order = await SalesOrderModel.findById(orderId);
      if (!order) throw new AppError('Sales order not found', 4404);

      const result = await SalesOrderModel.update(orderId, updateData);
      if (!result) throw new AppError('Failed to update sales order', 500);

      return await SalesOrderModel.findById(orderId);
    } catch (error) {
      logger.error('Error in SalesOrderService.updateOrder:', error);
      throw error;
    }
  },

  // Delete sales order
  deleteOrder: async (orderId, user) => {
    try {
      const order = await SalesOrderModel.findById(orderId);
      if (!order) throw new AppError('Sales order not found', 4404);

      return await SalesOrderModel.delete(orderId);
    } catch (error) {
      logger.error('Error in SalesOrderService.deleteOrder:', error);
      throw error;
    }
  },

  // Lookup data for sales orders
  getLookups: async () => {
    try {
      const [paymentStatuses, deliveryStatuses] = await Promise.all([
        PaymentStatusModel.getAll(),
        DeliveryStatusModel.getAll()
      ]);

      return {
        paymentStatuses,
        deliveryStatuses
      };
    } catch (error) {
      logger.error('Error in SalesOrderService.getLookups:', error);
      throw error;
    }
  }
};

module.exports = SalesOrderService;
