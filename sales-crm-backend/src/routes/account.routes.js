const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/account.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

router.use(authenticate);

router.get('/', checkPermission(PERMISSIONS.READ_ACCOUNT), AccountController.getAllAccounts);
router.get('/:id', checkPermission(PERMISSIONS.READ_ACCOUNT), AccountController.getAccountById);
router.post('/', checkPermission(PERMISSIONS.CREATE_ACCOUNT), AccountController.createAccount);
router.put('/:id', checkPermission(PERMISSIONS.UPDATE_ACCOUNT), AccountController.updateAccount);
router.delete('/:id', checkPermission(PERMISSIONS.DELETE_ACCOUNT), AccountController.deleteAccount);

module.exports = router;
