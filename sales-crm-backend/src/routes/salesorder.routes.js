const express = require('express');
const router = express.Router();
const SalesOrderController = require('../controllers/salesorder.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission, isAdminOrManager } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

// All sales order routes require authentication
router.use(authenticate);

// Get lookups for sales orders
router.get('/lookups', SalesOrderController.getLookups);

// Get all sales orders
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_SALES_ORDER),
  SalesOrderController.getAllOrders
);

// Get sales order by ID
router.get(
  '/:id',
  checkPermission(PERMISSIONS.READ_SALES_ORDER),
  SalesOrderController.getOrderById
);

// Create sales order
router.post(
  '/',
  checkPermission(PERMISSIONS.CREATE_SALES_ORDER),
  SalesOrderController.createOrder
);

// Update sales order
router.put(
  '/:id',
  checkPermission(PERMISSIONS.UPDATE_SALES_ORDER),
  SalesOrderController.updateOrder
);

// Delete sales order (Admin/Manager only)
router.delete(
  '/:id',
  isAdminOrManager,
  SalesOrderController.deleteOrder
);

module.exports = router;
