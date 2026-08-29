const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission, isAdminOrManager } = require('../middlewares/rbac.middleware');

// All dashboard routes require authentication
router.use(authenticate);

const dashboardController = require('../controllers/dashboard.controller');

router.get('/', isAdminOrManager, dashboardController.getDashboardStats);

module.exports = router;
