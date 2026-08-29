const ContactModel = require('../models/ContactModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const ContactService = {
  createContact: async (contactData, createdBy) => {
    try {
      const contactNumber = await ContactModel.getNextContactNumber();
      const contactId = await ContactModel.create({
        ...contactData,
        ContactNumber: contactNumber,
        CreatedBy: createdBy
      });
      return await ContactModel.findById(contactId);
    } catch (error) {
      logger.error('Create contact error:', error);
      throw error;
    }
  },

  getAllContacts: async (filters) => {
    try {
      const result = await ContactModel.findAll(filters);
      return helpers.formatPaginationResponse(
        result.contacts,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all contacts error:', error);
      throw error;
    }
  },

  getContactById: async (contactId) => {
    try {
      const contact = await ContactModel.findById(contactId);
      if (!contact) throw new AppError('Contact not found', HTTP_STATUS.NOT_FOUND);
      return contact;
    } catch (error) {
      logger.error('Get contact by ID error:', error);
      throw error;
    }
  },

  updateContact: async (contactId, updateData, userId) => {
    try {
      const contact = await ContactModel.findById(contactId);
      if (!contact) throw new AppError('Contact not found', HTTP_STATUS.NOT_FOUND);

      await ContactModel.update(contactId, {
        ...updateData,
        UpdatedBy: userId
      });
      return await ContactModel.findById(contactId);
    } catch (error) {
      logger.error('Update contact error:', error);
      throw error;
    }
  },

  deleteContact: async (contactId, userId) => {
    try {
      const contact = await ContactModel.findById(contactId);
      if (!contact) throw new AppError('Contact not found', HTTP_STATUS.NOT_FOUND);

      await ContactModel.delete(contactId, userId);
      return true;
    } catch (error) {
      logger.error('Delete contact error:', error);
      throw error;
    }
  }
};

module.exports = ContactService;
