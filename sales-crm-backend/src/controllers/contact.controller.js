const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const ContactService = require('../services/contactService');
const { HTTP_STATUS } = require('../config/constants');

const ContactController = {
  createContact: asyncHandler(async (req, res) => {
    const contact = await ContactService.createContact(req.body, req.user.UserId);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Contact created successfully',
      data: contact
    });
  }),

  getAllContacts: asyncHandler(async (req, res) => {
    const result = await ContactService.getAllContacts(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contacts retrieved successfully',
      ...result
    });
  }),

  getContactById: asyncHandler(async (req, res) => {
    const contact = await ContactService.getContactById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contact retrieved successfully',
      data: contact
    });
  }),

  updateContact: asyncHandler(async (req, res) => {
    const contact = await ContactService.updateContact(req.params.id, req.body, req.user.UserId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    });
  }),

  deleteContact: asyncHandler(async (req, res) => {
    await ContactService.deleteContact(req.params.id, req.user.UserId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  })
};

module.exports = ContactController;
