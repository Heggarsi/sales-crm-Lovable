const LeadModel = require('../models/LeadsModel');
const UserModel = require('../models/UsersModel');
const AccountModel = require('../models/AccountModel');
const ContactModel = require('../models/ContactModel');
const DealModel = require('../models/DealModel');
const LeadSourceModel = require('../models/LeadSourceModel');
const LeadTypeModel = require('../models/LeadTypeModel');
const LeadStatusModel = require('../models/LeadStatusModel');
const LeadServiceRequiredModel = require('../models/LeadServiceRequiredModel');
const LeadFollowUpTypeModel = require('../models/LeadFollowUpTypeModel');
const LeadFollowupModel = require('../models/LeadFollowupModel');
const emailService = require('../utils/emailService');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES, LEAD_STATUS } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const { pool } = require('../config/database');

const LeadService = {
  // Create new lead
  createLead: async (leadData, createdBy) => {
    try {
      // 🔐 Role Validation: Only assign to Sales Person
      if (leadData.AssignedToUserId) {
        const isSalesPerson = await UserModel.isSalesPerson(leadData.AssignedToUserId);
        if (!isSalesPerson) {
          throw new AppError('Lead can only be assigned to a user with the Sales Person role', HTTP_STATUS.BAD_REQUEST);
        }
      }

      // 🔎 Duplicate check: email must be unique
      if (leadData.Email) {
        const existingLead = await LeadModel.findByEmail(leadData.Email);
        if (existingLead) {
          throw new AppError('A lead with this email already exists', HTTP_STATUS.CONFLICT);
        }
      }

      const leadId = await LeadModel.create({
        ...leadData,
        CreatedBy: createdBy,
        LeadStatusId: LEAD_STATUS.NEW
      });

      const newLead = await LeadModel.findById(leadId);

      logger.info('Lead created successfully', { leadId, createdBy });

      return newLead;
    } catch (error) {
      logger.error('Create lead error:', error);
      throw error;
    }
  },

  // Get all leads (with access control)
  getAllLeads: async (filters, user) => {
    try {
      // Sales Person can only see their assigned leads
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
      }

      const result = await LeadModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.leads,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all leads error:', error);
      throw error;
    }
  },

  // Get lead by ID
  getLeadById: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      return lead;
    } catch (error) {
      logger.error('Get lead by ID error:', error);
      throw error;
    }
  },

  // Update lead
  updateLead: async (leadId, updateData, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only update leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // 🔐 Role Validation: Only assign to Sales Person
      if (updateData.AssignedToUserId) {
        const isSalesPerson = await UserModel.isSalesPerson(updateData.AssignedToUserId);
        if (!isSalesPerson) {
          throw new AppError('Lead can only be assigned to a user with the Sales Person role', HTTP_STATUS.BAD_REQUEST);
        }
      }

      // 🔎 Duplicate check: email must be unique (excluding this lead)
      if (updateData.Email) {
        const existingLead = await LeadModel.findByEmail(updateData.Email);
        if (existingLead && existingLead.LeadId !== parseInt(leadId)) {
          throw new AppError('A lead with this email already exists', HTTP_STATUS.CONFLICT);
        }
      }

      await LeadModel.update(leadId, {
        ...updateData,
        UpdatedBy: user.UserId
      });

      const updatedLead = await LeadModel.findById(leadId);

      logger.info('Lead updated successfully', { leadId, updatedBy: user.UserId });

      return updatedLead;
    } catch (error) {
      logger.error('Update lead error:', error);
      throw error;
    }
  },

  // Delete lead
  deleteLead: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only delete leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      await LeadModel.delete(leadId, user.UserId);

      logger.info('Lead deleted successfully', { leadId, deletedBy: user.UserId });

      return true;
    } catch (error) {
      logger.error('Delete lead error:', error);
      throw error;
    }
  },

  // Assign lead to sales person
  assignLead: async (leadId, assignedToUserId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // 🔐 Role Validation: Only assign to Sales Person
      if (assignedToUserId) {
        const isSalesPerson = await UserModel.isSalesPerson(assignedToUserId);
        if (!isSalesPerson) {
          throw new AppError('Lead can only be assigned to a user with the Sales Person role', HTTP_STATUS.BAD_REQUEST);
        }
      }

      await LeadModel.assignLead(leadId, assignedToUserId, user.UserId);

      const updatedLead = await LeadModel.findById(leadId);

      logger.info('Lead assigned successfully', {
        leadId,
        assignedToUserId,
        assignedBy: user.UserId
      });

      return updatedLead;
    } catch (error) {
      logger.error('Assign lead error:', error);
      throw error;
    }
  },

  // ====================================================================
  // LEAD CONVERSION
  // ====================================================================

  convertLead: async (leadId, conversionData, user) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch lead
      const lead = await LeadModel.findById(leadId);
      if (!lead) throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);

      if (lead.IsConverted) throw new AppError('Lead is already converted', HTTP_STATUS.BAD_REQUEST);

      // Check if lead status is Qualified (ID 4)
      if (lead.LeadStatusId !== LEAD_STATUS.QUALIFIED) {
        throw new AppError('Only Qualified leads can be converted', HTTP_STATUS.BAD_REQUEST);
      }

      // 2. Access Control
      if (user.RoleId === ROLES.SALES_PERSON && lead.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only convert leads assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      // 3. Create Account (or use existing)
      let accountId = null;
      const existingAccount = await AccountModel.findByName(lead.CompanyName);
      
      if (existingAccount) {
        accountId = existingAccount.AccountId;
        logger.info('Using existing account for lead conversion', { leadId, accountId, companyName: lead.CompanyName });
      } else {
        const accountNumber = await AccountModel.getNextAccountNumber();
        accountId = await AccountModel.create({
          AccountNumber: accountNumber,
          AccountName: lead.CompanyName,
          Phone: lead.Phone,
          Website: null,
          Industry: lead.Industry,
          AnnualRevenue: lead.AnnualRevenue,
          BillingStreet: lead.Address,
          BillingCity: lead.City,
          BillingState: lead.State,
          BillingCountry: lead.Country,
          CreatedBy: user.UserId
        });
        logger.info('Created new account for lead conversion', { leadId, accountId });
      }

      // 4. Create Contact
      const contactNumber = await ContactModel.getNextContactNumber();
      const contactId = await ContactModel.create({
        ContactNumber: contactNumber,
        FirstName: lead.FirstName,
        LastName: lead.LastName,
        Email: lead.Email,
        Phone: lead.Phone,
        Mobile: lead.Mobile,
        AccountId: accountId,
        LeadSource: lead.SourceName,
        MailingStreet: lead.Address,
        MailingCity: lead.City,
        MailingState: lead.State,
        MailingCountry: lead.Country,
        CreatedBy: user.UserId
      });

      let dealId = null;
      // 5. Create Deal (if requested)
      if (conversionData.createDeal) {
        const dealNumber = await DealModel.getNextDealNumber();
        dealId = await DealModel.create({
          DealNumber: dealNumber,
          DealName: conversionData.dealName || `${lead.CompanyName} Deal`,
          DealStageId: conversionData.dealStageId || 1, // Default to Qualification
          ClosingDate: conversionData.closingDate,
          AccountId: accountId,
          ContactId: contactId,
          Amount: conversionData.amount || null,
          AssignedToUserId: lead.AssignedToUserId,
          CreatedBy: user.UserId
        });
      }

      // 6. Update Lead status and conversion info
      await LeadModel.update(leadId, {
        LeadStatusId: LEAD_STATUS.QUALIFIED,
        IsConverted: 1,
        ConvertedAt: new Date(),
        ConvertedAccountId: accountId,
        ConvertedContactId: contactId,
        ConvertedDealId: dealId,
        UpdatedBy: user.UserId
      });

      await connection.commit();

      logger.info('Lead converted successfully', { leadId, accountId, contactId, dealId, userId: user.UserId });

      return {
        success: true,
        accountId,
        contactId,
        dealId,
        message: 'Lead converted successfully'
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Lead conversion error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Send introduction email
  sendIntroEmail: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only send emails for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      if (!lead.Email) {
        throw new AppError('Lead email is required', HTTP_STATUS.BAD_REQUEST);
      }

      // Send email
      await emailService.sendIntroductionEmail(
        lead.Email,
        `${lead.FirstName} ${lead.LastName}`.trim(),
        user.Name
      );

      // Update lead status to contacted if it's new
      if (lead.LeadStatusId === LEAD_STATUS.NEW) {
        await LeadModel.updateStatus(leadId, LEAD_STATUS.CONTACTED, user.UserId);
      }

      logger.info('Introduction email sent', { leadId, to: lead.Email });

      return { success: true, message: 'Introduction email sent successfully' };
    } catch (error) {
      logger.error('Send intro email error:', error);
      throw error;
    }
  },

  // Get lead sources
  getLeadSources: async () => {
    try {
      return await LeadSourceModel.getAll();
    } catch (error) {
      logger.error('Get lead sources error:', error);
      throw error;
    }
  },

  // Get lead types
  getLeadTypes: async () => {
    try {
      return await LeadTypeModel.getAll();
    } catch (error) {
      logger.error('Get lead types error:', error);
      throw error;
    }
  },

  // Get lead statuses
  getLeadStatuses: async () => {
    try {
      return await LeadStatusModel.getAll();
    } catch (error) {
      logger.error('Get lead statuses error:', error);
      throw error;
    }
  },

  // Get lead services
  getLeadServices: async () => {
    try {
      return await LeadServiceRequiredModel.getAll();
    } catch (error) {
      logger.error('Get lead services error:', error);
      throw error;
    }
  },

  // Get lead follow-up types
  getLeadFollowUpTypes: async () => {
    try {
      return await LeadFollowUpTypeModel.getAll();
    } catch (error) {
      logger.error('Get lead follow-up types error:', error);
      throw error;
    }
  },

  // ==================== FOLLOW-UP CRUD ====================

  // Add follow-up to a lead
  createFollowUp: async (leadId, followUpData, user) => {
    try {
      const lead = await LeadModel.findById(leadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      if (user.RoleId === ROLES.SALES_PERSON && lead.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only add follow-ups for leads assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      const followUpTypeExists = await LeadFollowUpTypeModel.exists(followUpData.FollowUpTypeId);
      if (!followUpTypeExists) {
        throw new AppError('Invalid follow-up type', HTTP_STATUS.BAD_REQUEST);
      }

      const followUpId = await LeadFollowupModel.create({
        LeadId: parseInt(leadId),
        FollowUpDate: followUpData.FollowUpDate,
        FollowUpTypeId: followUpData.FollowUpTypeId,
        Remarks: followUpData.Remarks,
        NextFollowUpDate: followUpData.NextFollowUpDate,
        CreatedByUserId: user.UserId
      });

      const followUp = await LeadFollowupModel.findById(followUpId);

      logger.info('Follow-up added to lead', { leadId, followUpId, userId: user.UserId });

      return followUp;
    } catch (error) {
      logger.error('Create follow-up error:', error);
      throw error;
    }
  },

  // Get all follow-ups for a lead
  getLeadFollowUps: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      if (user.RoleId === ROLES.SALES_PERSON && lead.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only access leads assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      return await LeadFollowupModel.getByLeadId(leadId);
    } catch (error) {
      logger.error('Get lead follow-ups error:', error);
      throw error;
    }
  },

  // Get single follow-up
  getFollowUpById: async (leadId, followUpId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      if (user.RoleId === ROLES.SALES_PERSON && lead.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only access leads assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      const followUp = await LeadFollowupModel.findById(followUpId);
      if (!followUp || followUp.LeadId !== parseInt(leadId)) {
        throw new AppError('Follow-up not found', HTTP_STATUS.NOT_FOUND);
      }

      return followUp;
    } catch (error) {
      logger.error('Get follow-up by ID error:', error);
      throw error;
    }
  },

  // Update follow-up
  updateFollowUp: async (leadId, followUpId, followUpData, user) => {
    try {
      const lead = await LeadModel.findById(leadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      if (user.RoleId === ROLES.SALES_PERSON && lead.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only update follow-ups for leads assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      const followUp = await LeadFollowupModel.findById(followUpId);
      if (!followUp || followUp.LeadId !== parseInt(leadId)) {
        throw new AppError('Follow-up not found', HTTP_STATUS.NOT_FOUND);
      }

      if (followUpData.FollowUpTypeId) {
        const followUpTypeExists = await LeadFollowUpTypeModel.exists(followUpData.FollowUpTypeId);
        if (!followUpTypeExists) {
          throw new AppError('Invalid follow-up type', HTTP_STATUS.BAD_REQUEST);
        }
      }

      await LeadFollowupModel.update(followUpId, followUpData);

      return await LeadFollowupModel.findById(followUpId);
    } catch (error) {
      logger.error('Update follow-up error:', error);
      throw error;
    }
  },

  // Delete follow-up
  deleteFollowUp: async (leadId, followUpId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      if (user.RoleId === ROLES.SALES_PERSON && lead.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only delete follow-ups for leads assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      const exists = await LeadFollowupModel.exists(followUpId, leadId);
      if (!exists) {
        throw new AppError('Follow-up not found', HTTP_STATUS.NOT_FOUND);
      }

      await LeadFollowupModel.delete(followUpId);
      return true;
    } catch (error) {
      logger.error('Delete follow-up error:', error);
      throw error;
    }
  },

  // ==================== LEAD SOURCE CRUD ====================
  createLeadSource: async (sourceData) => {
    try {
      const existing = await LeadSourceModel.findByName(sourceData.SourceName);
      if (existing) {
        throw new AppError('Lead source name already exists', HTTP_STATUS.CONFLICT);
      }
      const sourceId = await LeadSourceModel.create(sourceData);
      return await LeadSourceModel.findById(sourceId);
    } catch (error) {
      logger.error('Create lead source error:', error);
      throw error;
    }
  },

  updateLeadSource: async (sourceId, sourceData) => {
    try {
      const source = await LeadSourceModel.findById(sourceId);
      if (!source) {
        throw new AppError('Lead source not found', HTTP_STATUS.NOT_FOUND);
      }
      if (sourceData.SourceName) {
        const existing = await LeadSourceModel.findByName(sourceData.SourceName);
        if (existing && existing.SourceId !== parseInt(sourceId)) {
          throw new AppError('Lead source name already exists', HTTP_STATUS.CONFLICT);
        }
      }
      await LeadSourceModel.update(sourceId, sourceData);
      return await LeadSourceModel.findById(sourceId);
    } catch (error) {
      logger.error('Update lead source error:', error);
      throw error;
    }
  },

  deleteLeadSource: async (sourceId) => {
    try {
      const source = await LeadSourceModel.findById(sourceId);
      if (!source) {
        throw new AppError('Lead source not found', HTTP_STATUS.NOT_FOUND);
      }
      await LeadSourceModel.delete(sourceId);
      return true;
    } catch (error) {
      logger.error('Delete lead source error:', error);
      throw error;
    }
  },

  // ==================== LEAD TYPE CRUD ====================
  createLeadType: async (typeData) => {
    try {
      const existing = await LeadTypeModel.findByName(typeData.TypeName);
      if (existing) {
        throw new AppError('Lead type name already exists', HTTP_STATUS.CONFLICT);
      }
      const typeId = await LeadTypeModel.create(typeData);
      return await LeadTypeModel.findById(typeId);
    } catch (error) {
      logger.error('Create lead type error:', error);
      throw error;
    }
  },

  updateLeadType: async (typeId, typeData) => {
    try {
      const type = await LeadTypeModel.findById(typeId);
      if (!type) {
        throw new AppError('Lead type not found', HTTP_STATUS.NOT_FOUND);
      }
      if (typeData.TypeName) {
        const existing = await LeadTypeModel.findByName(typeData.TypeName);
        if (existing && existing.LeadTypeId !== parseInt(typeId)) {
          throw new AppError('Lead type name already exists', HTTP_STATUS.CONFLICT);
        }
      }
      await LeadTypeModel.update(typeId, typeData);
      return await LeadTypeModel.findById(typeId);
    } catch (error) {
      logger.error('Update lead type error:', error);
      throw error;
    }
  },

  deleteLeadType: async (typeId) => {
    try {
      const type = await LeadTypeModel.findById(typeId);
      if (!type) {
        throw new AppError('Lead type not found', HTTP_STATUS.NOT_FOUND);
      }
      await LeadTypeModel.delete(typeId);
      return true;
    } catch (error) {
      logger.error('Delete lead type error:', error);
      throw error;
    }
  },

  // ==================== LEAD STATUS CRUD ====================
  createLeadStatus: async (statusData) => {
    try {
      const existing = await LeadStatusModel.findByName(statusData.StatusName);
      if (existing) {
        throw new AppError('Lead status name already exists', HTTP_STATUS.CONFLICT);
      }
      const statusId = await LeadStatusModel.create(statusData);
      return await LeadStatusModel.findById(statusId);
    } catch (error) {
      logger.error('Create lead status error:', error);
      throw error;
    }
  },

  updateLeadStatus: async (statusId, statusData) => {
    try {
      const status = await LeadStatusModel.findById(statusId);
      if (!status) {
        throw new AppError('Lead status not found', HTTP_STATUS.NOT_FOUND);
      }
      if (statusData.StatusName) {
        const existing = await LeadStatusModel.findByName(statusData.StatusName);
        if (existing && existing.LeadStatusId !== parseInt(statusId)) {
          throw new AppError('Lead status name already exists', HTTP_STATUS.CONFLICT);
        }
      }
      await LeadStatusModel.update(statusId, statusData);
      return await LeadStatusModel.findById(statusId);
    } catch (error) {
      logger.error('Update lead status error:', error);
      throw error;
    }
  },

  deleteLeadStatus: async (statusId) => {
    try {
      const status = await LeadStatusModel.findById(statusId);
      if (!status) {
        throw new AppError('Lead status not found', HTTP_STATUS.NOT_FOUND);
      }
      await LeadStatusModel.delete(statusId);
      return true;
    } catch (error) {
      logger.error('Delete lead status error:', error);
      throw error;
    }
  },

  // GET BY ID METHODS
  getLeadSourceById: async (sourceId) => {
    try {
      const source = await LeadSourceModel.findById(sourceId);
      if (!source) throw new AppError('Lead source not found', HTTP_STATUS.NOT_FOUND);
      return source;
    } catch (error) {
      logger.error('Get lead source by ID error:', error);
      throw error;
    }
  },

  getLeadTypeById: async (typeId) => {
    try {
      const type = await LeadTypeModel.findById(typeId);
      if (!type) throw new AppError('Lead type not found', HTTP_STATUS.NOT_FOUND);
      return type;
    } catch (error) {
      logger.error('Get lead type by ID error:', error);
      throw error;
    }
  },

  getLeadStatusById: async (statusId) => {
    try {
      const status = await LeadStatusModel.findById(statusId);
      if (!status) throw new AppError('Lead status not found', HTTP_STATUS.NOT_FOUND);
      return status;
    } catch (error) {
      logger.error('Get lead status by ID error:', error);
      throw error;
    }
  },

  // ==================== LEAD SERVICE REQUIRED CRUD ====================
  createLeadService: async (serviceData) => {
    try {
      const existing = await LeadServiceRequiredModel.findByName(serviceData.ServiceName);
      if (existing) {
        throw new AppError('Lead service name already exists', HTTP_STATUS.CONFLICT);
      }
      const serviceId = await LeadServiceRequiredModel.create(serviceData);
      return await LeadServiceRequiredModel.findById(serviceId);
    } catch (error) {
      logger.error('Create lead service error:', error);
      throw error;
    }
  },

  updateLeadService: async (serviceId, serviceData) => {
    try {
      const service = await LeadServiceRequiredModel.findById(serviceId);
      if (!service) {
        throw new AppError('Lead service not found', HTTP_STATUS.NOT_FOUND);
      }
      if (serviceData.ServiceName) {
        const existing = await LeadServiceRequiredModel.findByName(serviceData.ServiceName);
        if (existing && existing.ServiceRequiredId !== parseInt(serviceId)) {
          throw new AppError('Lead service name already exists', HTTP_STATUS.CONFLICT);
        }
      }
      await LeadServiceRequiredModel.update(serviceId, serviceData);
      return await LeadServiceRequiredModel.findById(serviceId);
    } catch (error) {
      logger.error('Update lead service error:', error);
      throw error;
    }
  },

  deleteLeadService: async (serviceId) => {
    try {
      const service = await LeadServiceRequiredModel.findById(serviceId);
      if (!service) {
        throw new AppError('Lead service not found', HTTP_STATUS.NOT_FOUND);
      }
      await LeadServiceRequiredModel.delete(serviceId);
      return true;
    } catch (error) {
      logger.error('Delete lead service error:', error);
      throw error;
    }
  },

  getLeadServiceById: async (serviceId) => {
    try {
      const service = await LeadServiceRequiredModel.findById(serviceId);
      if (!service) throw new AppError('Lead service not found', HTTP_STATUS.NOT_FOUND);
      return service;
    } catch (error) {
      logger.error('Get lead service by ID error:', error);
      throw error;
    }
  },

  // ==================== LEAD FOLLOW-UP TYPE CRUD ====================
  createLeadFollowUpType: async (typeData) => {
    try {
      const existing = await LeadFollowUpTypeModel.findByName(typeData.TypeName);
      if (existing) {
        throw new AppError('Follow-up type name already exists', HTTP_STATUS.CONFLICT);
      }
      const typeId = await LeadFollowUpTypeModel.create(typeData);
      return await LeadFollowUpTypeModel.findById(typeId);
    } catch (error) {
      logger.error('Create follow-up type error:', error);
      throw error;
    }
  },

  updateLeadFollowUpType: async (typeId, typeData) => {
    try {
      const type = await LeadFollowUpTypeModel.findById(typeId);
      if (!type) {
        throw new AppError('Follow-up type not found', HTTP_STATUS.NOT_FOUND);
      }
      if (typeData.TypeName) {
        const existing = await LeadFollowUpTypeModel.findByName(typeData.TypeName);
        if (existing && existing.FollowUpTypeId !== parseInt(typeId)) {
          throw new AppError('Follow-up type name already exists', HTTP_STATUS.CONFLICT);
        }
      }
      await LeadFollowUpTypeModel.update(typeId, typeData);
      return await LeadFollowUpTypeModel.findById(typeId);
    } catch (error) {
      logger.error('Update follow-up type error:', error);
      throw error;
    }
  },

  deleteLeadFollowUpType: async (typeId) => {
    try {
      const type = await LeadFollowUpTypeModel.findById(typeId);
      if (!type) {
        throw new AppError('Follow-up type not found', HTTP_STATUS.NOT_FOUND);
      }
      await LeadFollowUpTypeModel.delete(typeId);
      return true;
    } catch (error) {
      logger.error('Delete follow-up type error:', error);
      throw error;
    }
  },

  getLeadFollowUpTypeById: async (typeId) => {
    try {
      const type = await LeadFollowUpTypeModel.findById(typeId);
      if (!type) throw new AppError('Follow-up type not found', HTTP_STATUS.NOT_FOUND);
      return type;
    } catch (error) {
      logger.error('Get follow-up type by ID error:', error);
      throw error;
    }
  },

};

module.exports = LeadService;

//   // Get lead statistics
//   getLeadStatistics: async (requestingUser) => {
//     try {
//       // Sales Person gets only their stats
//       const userId = requestingUser.RoleId === ROLES.SALES_PERSON
//         ? requestingUser.UserId
//         : null;

//       return await LeadModel.getStatistics(userId);
//     } catch (error) {
//       logger.error('Get lead statistics error:', error);
//       throw error;
//     }
//   }