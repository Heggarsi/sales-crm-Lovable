const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/audit.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdminOrManager } = require('../middlewares/rbac.middleware');

// Audit logs are highly sensitive, restricted to Admin/Manager
router.use(authenticate);
router.use(isAdminOrManager);

// Get all audit logs
router.get('/', AuditController.getAllLogs);

// Get audit logs for specific record
router.get('/:tableName/:recordId', AuditController.getLogsByRecord);

module.exports = router;
