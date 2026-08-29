const express = require('express');
const router = express.Router();
const LookupController = require('../controllers/lookup.controller');
const lookupValidation = require('../validations/lookupValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdminOrManager } = require('../middlewares/rbac.middleware');

// All lookup routes require authentication
router.use(authenticate);

// Helper function to register CRUD routes for a lookup
const registerLookupRoutes = (path, controller) => {
  router.get(`/${path}`, controller.getAll);
  router.get(`/${path}/:id`, lookupValidation.idParam, validate, controller.getById);
  
  // Create, Update, Delete usually restricted to Admin/Manager
  router.post(`/${path}`, isAdminOrManager, lookupValidation.createLookup, validate, controller.create);
  router.put(`/${path}/:id`, isAdminOrManager, lookupValidation.updateLookup, validate, controller.update);
  router.delete(`/${path}/:id`, isAdminOrManager, lookupValidation.idParam, validate, controller.delete);
};

registerLookupRoutes('activity-types', LookupController.activityTypes);
registerLookupRoutes('appointment-statuses', LookupController.appointmentStatuses);
// registerLookupRoutes('opportunity-statuses', LookupController.opportunityStatuses);
registerLookupRoutes('proposal-statuses', LookupController.proposalStatuses);
registerLookupRoutes('payment-statuses', LookupController.paymentStatuses);
registerLookupRoutes('delivery-statuses', LookupController.deliveryStatuses);
registerLookupRoutes('lead-sources', LookupController.leadSources);
registerLookupRoutes('lead-types', LookupController.leadTypes);
registerLookupRoutes('lead-statuses', LookupController.leadStatuses);
registerLookupRoutes('lead-service-required', LookupController.leadServiceRequired);
registerLookupRoutes('lead-followup-types', LookupController.leadFollowUpTypes);

module.exports = router;
