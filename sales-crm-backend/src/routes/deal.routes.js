const express = require('express');
const router = express.Router();
const DealController = require('../controllers/deal.controller');
const dealValidation = require('../validations/dealValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../config/constants');

router.use(authenticate);

router.get('/stages', DealController.getDealStages);
router.get('/stages/:id', DealController.getDealStageById);
router.post('/stages', checkPermission(PERMISSIONS.UPDATE_SETTINGS), DealController.createDealStage);
router.put('/stages/:id', checkPermission(PERMISSIONS.UPDATE_SETTINGS), DealController.updateDealStage);
router.delete('/stages/:id', checkPermission(PERMISSIONS.UPDATE_SETTINGS), DealController.deleteDealStage);
router.get('/', checkPermission(PERMISSIONS.READ_DEAL), DealController.getAllDeals);
router.get('/:id', dealValidation.getDealById, validate, checkPermission(PERMISSIONS.READ_DEAL), DealController.getDealById);
router.post('/', checkPermission(PERMISSIONS.CREATE_DEAL), dealValidation.createDeal, validate, DealController.createDeal);
router.put('/:id', checkPermission(PERMISSIONS.UPDATE_DEAL), dealValidation.updateDeal, validate, DealController.updateDeal);
router.delete('/:id', checkPermission(PERMISSIONS.DELETE_DEAL), dealValidation.deleteDeal, validate, DealController.deleteDeal);

module.exports = router;
