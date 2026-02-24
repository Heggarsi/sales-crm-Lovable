const LeadModel = require('../models/LeadsModel');
const LeadBusinessInfoModel = require('../models/LeadBusinessInfoModel');
const LeadQualificationModel = require('../models/LeadQualificationModel');
const LeadSourceModel = require('../models/LeadSourceModel');
const LeadTypeModel = require('../models/LeadTypeModel');
const LeadStatusModel = require('../models/LeadStatusModel');
const QualificationStatusModel = require('../models/QualificationStatusModel')
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

      // In-memory ownership check (no extra DB call)
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
  // QUALIFICATION MODULE - Industry Standard Implementation
  // ====================================================================

  // Get qualification details (Lead + Business Info)
  getQualificationDetails: async (leadId, user) => {
    try {
      // Fetch lead
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

      // Get business info
      const businessInfo = await LeadBusinessInfoModel.findByLeadId(leadId);

      // Get existing qualification (if any)
      const qualification = await LeadQualificationModel.findByLeadId(leadId);

      return {
        lead,
        businessInfo,
        qualification,
        canQualify: !businessInfo ? false : (lead.LeadStatusId === 1 || lead.LeadStatusId === 2)
      };
    } catch (error) {
      logger.error('Get qualification details error:', error);
      throw error;
    }
  },

  // Add/Update business info
  addOrUpdateBusinessInfo: async (leadId, businessData, user) => {
    try {
      const lead = await LeadModel.findById(leadId);
      
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only update business info for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Check if business info already exists
      const existing = await LeadBusinessInfoModel.findByLeadId(leadId);

      if (existing) {
        // Update existing
        await LeadBusinessInfoModel.update(existing.BusinessInfoId, businessData);
      } else {
        // Create new
        await LeadBusinessInfoModel.create({
          ...businessData,
          LeadId: leadId,
          CapturedByUserId: user.UserId
        });
      }

      const businessInfo = await LeadBusinessInfoModel.findByLeadId(leadId);

      logger.info('Business info saved successfully', { leadId, userId: user.UserId });

      return businessInfo;
    } catch (error) {
      logger.error('Add/Update business info error:', error);
      throw error;
    }
  },

  // Accept Qualification (Qualified)
  acceptQualification: async (leadId, qualificationData, user) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Fetch lead
      const lead = await LeadModel.findById(leadId);
      
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // 2. In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only qualify leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // 3. Check if business info exists
      const businessInfo = await LeadBusinessInfoModel.findByLeadId(leadId);
      if (!businessInfo) {
        throw new AppError(
          'Business information must be captured before qualification',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // 4. Check if lead can be qualified (status must be New or Contacted)
      if (lead.LeadStatusId !== LEAD_STATUS.NEW && lead.LeadStatusId !== LEAD_STATUS.CONTACTED) {
        throw new AppError(
          'Lead must be in New or Contacted status for qualification',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // 5. Check if already qualified
      const isAlreadyQualified = await LeadModel.isQualified(leadId);
      if (isAlreadyQualified) {
        throw new AppError('Lead is already qualified', HTTP_STATUS.CONFLICT);
      }

      // 6. Update lead status to Qualified (3)
      await connection.query(
        `UPDATE leads 
         SET LeadStatusId = ?, UpdatedBy = ?, UpdatedAt = NOW() 
         WHERE LeadId = ?`,
        [LEAD_STATUS.QUALIFIED, user.UserId, leadId]
      );

      // 7. Insert into leadqualification table
      const {
        RequirementSummary,
        PainPoints,
        DecisionTimeframe,
        CompetitorAnalysis
      } = qualificationData;

      const [qualificationResult] = await connection.query(
        `INSERT INTO leadqualification (
          LeadId, Budget, BudgetCurrency, RequirementSummary, PainPoints,
          DecisionTimeframe, CompetitorAnalysis, QualificationStatusId,
          QualifiedByUserId, QualifiedAt, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), 0, NOW(), NOW())`,
        [
          leadId,
          businessInfo.Budget,
          businessInfo.BudgetCurrency,
          RequirementSummary,
          PainPoints,
          DecisionTimeframe || businessInfo.Timeline,
          CompetitorAnalysis || businessInfo.Competition,
          user.UserId
        ]
      );

      await connection.commit();

      const updatedLead = await LeadModel.findById(leadId);
      const qualification = await LeadQualificationModel.findByLeadId(leadId);

      logger.info('Lead qualified successfully', { 
        leadId, 
        qualificationId: qualificationResult.insertId,
        qualifiedBy: user.UserId 
      });

      return {
        lead: updatedLead,
        qualification,
        message: 'Lead qualified successfully. Ready to create opportunity.'
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Accept qualification error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Reject Qualification (Unqualified)
  rejectQualification: async (leadId, rejectData, user) => {
    try {
      // 1. Fetch lead
      const lead = await LeadModel.findById(leadId);
      
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // 2. In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only qualify leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // 3. Check if lead can be qualified (status must be New or Contacted)
      if (lead.LeadStatusId !== LEAD_STATUS.NEW && lead.LeadStatusId !== LEAD_STATUS.CONTACTED) {
        throw new AppError(
          'Lead must be in New or Contacted status for qualification',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // 4. Check if already unqualified
      const isAlreadyUnqualified = await LeadModel.isUnqualified(leadId);
      if (isAlreadyUnqualified) {
        throw new AppError('Lead is already marked as unqualified', HTTP_STATUS.CONFLICT);
      }

      // 5. Update lead status to Unqualified (4)
      // NO entry in leadqualification table (industry standard)
      await LeadModel.updateStatus(leadId, LEAD_STATUS.UNQUALIFIED, user.UserId);

      const updatedLead = await LeadModel.findById(leadId);

      logger.info('Lead rejected/unqualified', { 
        leadId, 
        rejectedBy: user.UserId,
        reason: rejectData.reason || 'Not specified'
      });

      return {
        lead: updatedLead,
        message: 'Lead marked as unqualified'
      };

    } catch (error) {
      logger.error('Reject qualification error:', error);
      throw error;
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
        lead.CustomerName,
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

  // Get Qualification statuses
  getQualificationStatuses: async () => {
    try {
      return await QualificationStatusModel.getAll();
    } catch (error) {
      logger.error('Get lead sources error:', error);
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