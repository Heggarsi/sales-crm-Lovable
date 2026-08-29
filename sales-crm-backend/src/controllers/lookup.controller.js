const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');

// Generic function to create lookup methods
const createLookupController = (Model, idField, nameField) => ({
  getAll: asyncHandler(async (req, res) => {
    const data = await Model.getAll();
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  }),

  getById: asyncHandler(async (req, res) => {
    const data = await Model.findById(req.params.id);
    if (!data) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Item not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  }),

  create: asyncHandler(async (req, res) => {
    // Map whatever name field comes in to the expected one if needed, 
    // but usually frontend sends the right field.
    const id = await Model.create(req.body);
    const data = await Model.findById(id);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Item created successfully', data });
  }),

  update: asyncHandler(async (req, res) => {
    const success = await Model.update(req.params.id, req.body);
    if (!success) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Item not found' });
    const data = await Model.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Item updated successfully', data });
  }),

  delete: asyncHandler(async (req, res) => {
    const success = await Model.delete(req.params.id);
    if (!success) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Item not found' });
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Item deleted successfully' });
  })
});

const ActivityTypeModel = require('../models/ActivityTypeModel');
const AppointmentStatusModel = require('../models/AppointmentStatusModel');
const ProposalStatusModel = require('../models/ProposalStatusModel');
const PaymentStatusModel = require('../models/PaymentStatusModel');
const DeliveryStatusModel = require('../models/DeliveryStatusModel');
const LeadSourceModel = require('../models/LeadSourceModel');
const LeadTypeModel = require('../models/LeadTypeModel');
const LeadStatusModel = require('../models/LeadStatusModel');
const LeadServiceRequiredModel = require('../models/LeadServiceRequiredModel');
const LeadFollowUpTypeModel = require('../models/LeadFollowUpTypeModel');

module.exports = {
  activityTypes: createLookupController(ActivityTypeModel, 'ActivityTypeId', 'TypeName'),
  appointmentStatuses: createLookupController(AppointmentStatusModel, 'AppointmentStatusId', 'StatusName'),
  proposalStatuses: createLookupController(ProposalStatusModel, 'ProposalStatusId', 'StatusName'),
  paymentStatuses: createLookupController(PaymentStatusModel, 'PaymentStatusId', 'StatusName'),
  deliveryStatuses: createLookupController(DeliveryStatusModel, 'DeliveryStatusId', 'StatusName'),
  leadSources: createLookupController(LeadSourceModel, 'SourceId', 'SourceName'),
  leadTypes: createLookupController(LeadTypeModel, 'LeadTypeId', 'TypeName'),
  leadStatuses: createLookupController(LeadStatusModel, 'LeadStatusId', 'StatusName'),
  leadServiceRequired: createLookupController(LeadServiceRequiredModel, 'ServiceRequiredId', 'ServiceName'),
  leadFollowUpTypes: createLookupController(LeadFollowUpTypeModel, 'FollowUpTypeId', 'TypeName')
};
