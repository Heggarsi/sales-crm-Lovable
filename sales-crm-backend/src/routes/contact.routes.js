const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contact.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

router.use(authenticate);

router.get('/', checkPermission(PERMISSIONS.READ_CONTACT), ContactController.getAllContacts);
router.get('/:id', checkPermission(PERMISSIONS.READ_CONTACT), ContactController.getContactById);
router.post('/', checkPermission(PERMISSIONS.CREATE_CONTACT), ContactController.createContact);
router.put('/:id', checkPermission(PERMISSIONS.UPDATE_CONTACT), ContactController.updateContact);
router.delete('/:id', checkPermission(PERMISSIONS.DELETE_CONTACT), ContactController.deleteContact);

module.exports = router;
