const LostOpportunityModel = require('../models/LostOpportunityModel');
const OpportunityModel = require('../models/OpportunityModel');
const LeadModel = require('../models/LeadsModel');
const ActivityLogModel = require('../models/ActivityLogModel');
const AuditLogModel = require('../models/AuditLogModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const { pool } = require('../config/database');

const LostOpportunityService = {
  // Predefined loss reasons
  LOSS_REASONS: [
    'Price too high',
    'Budget constraints',
    'Lost to competitor',
    'No budget allocated',
    'Project postponed',
    'Customer went with in-house solution',
    'Product/service not a good fit',
    'Timing not right',
    'Decision maker changed',
    'Company restructuring',
    'Other'
  ],

  // Lose opportunity (create lost opportunity record)
  loseOpportunity: async (opportunityId, lostData, user) => {
    const MAX_ATTEMPTS = 3;
    let attempt = 0;
  
    while (attempt < MAX_ATTEMPTS) {
      const connection = await pool.getConnection();
      try {
        attempt++;
  
        await connection.beginTransaction();
  
        const opportunity = await OpportunityModel.findById(opportunityId);
  
        if (!opportunity) {
          throw new AppError('Opportunity not found', HTTP_STATUS.NOT_FOUND);
        }
  
        // In-memory ownership check
        if (user.RoleId === ROLES.SALES_PERSON) {
          if (opportunity.AssignedToUserId !== user.UserId) {
            throw new AppError('You can only lose opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
          }
        }
  
        // Check if already closed
        const isClosed = await OpportunityModel.isClosed(opportunityId);
        if (isClosed) {
          throw new AppError('Opportunity is already closed', HTTP_STATUS.BAD_REQUEST);
        }
  
        // Validate loss reason
        if (!lostData.LostReason) {
          throw new AppError('Loss reason is required', HTTP_STATUS.BAD_REQUEST);
        }
  
        // Mark opportunity as lost
        await connection.query(
          `UPDATE opportunity 
           SET OpportunityStageId = 6, 
               OpportunityStatusId = 3,
               Probability = 0,
               ActualCloseDate = NOW(),
               UpdatedAt = NOW()
           WHERE OpportunityId = ?`,
          [opportunityId]
        );
  
        // Create lost opportunity record
        const lostOpportunityId = await LostOpportunityModel.create({
          OpportunityId: opportunityId,
          LostReason: lostData.LostReason,
          DetailedReason: lostData.DetailedReason,
          CompetitorName: lostData.CompetitorName,
          CompetitorPrice: lostData.CompetitorPrice,
          LostToCompetitor: lostData.LostToCompetitor || 0,
          ClientFeedback: lostData.ClientFeedback,
          LessonsLearned: lostData.LessonsLearned,
          FollowUpPlan: lostData.FollowUpPlan,
          PotentialFutureOpportunity: lostData.PotentialFutureOpportunity || 0,
          RevisitDate: lostData.RevisitDate,
          RecordedByUserId: user.UserId
        },
        connection
      );
  
        // Log activity
        await connection.query(
          `INSERT INTO activitylog (
            LeadId, ActivityTypeId, Subject, Description, Direction,
            Outcome, ActivityDate, CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
          ) VALUES (?, 3, ?, ?, 'Internal', 'Lost', NOW(), ?, 0, NOW(), NOW())`,
          [
            opportunity.LeadId,
            `Opportunity Lost: ${opportunity.OpportunityName}`,
            `Opportunity lost. Reason: ${lostData.LostReason}. ${lostData.DetailedReason || ''}`,
            user.UserId
          ]
        );
  
        // Audit log
        await connection.query(
          `INSERT INTO auditlog (
            TableName, RecordId, Action, OldValues, NewValues, ChangedBy, ChangedAt
          ) VALUES ('opportunity', ?, 'LOSE', ?, ?, ?, NOW())`,
          [
            opportunityId,
            JSON.stringify({ OpportunityStatusId: opportunity.OpportunityStatusId }),
            JSON.stringify({ 
              OpportunityStatusId: 3, 
              OpportunityStageId: 6,
              LostReason: lostData.LostReason 
            }),
            user.UserId
          ]
        );
  
        await connection.commit();
        connection.release();
  
        const updatedOpportunity = await OpportunityModel.findById(opportunityId);
        const lostOpportunity = await LostOpportunityModel.findById(lostOpportunityId);
        

  
        logger.info('Opportunity marked as lost', { 
          opportunityId, 
          lostOpportunityId,
          lostBy: user.UserId
        });
  
        return {
          opportunity: updatedOpportunity,
          lostOpportunity: lostOpportunity,
          message: 'Opportunity marked as lost'
        };
      } catch (error) {
        await connection.rollback();
        connection.release();
  
        // Retry only on MySQL lock wait timeout
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && attempt < MAX_ATTEMPTS) {
          logger.warn(`Lock wait timeout detected. Retrying attempt ${attempt}...`);
          await new Promise(r => setTimeout(r, 500)); // small delay before retry
        } else {
          logger.error('Lose opportunity error:', error);
          throw error; // rethrow for all other errors or after max attempts
        }
      }
    }
  },
  

  // Get all lost opportunities
  getAllLostOpportunities: async (filters, user) => {
    try {
      // Sales Person can only see lost opportunities for their leads
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
      }

      const result = await LostOpportunityModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.lostOpportunities,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all lost opportunities error:', error);
      throw error;
    }
  },

  // Get lost opportunity by ID
  getLostOpportunityById: async (lostOpportunityId, user) => {
    try {
      const lostOpportunity = await LostOpportunityModel.findById(lostOpportunityId);

      if (!lostOpportunity) {
        throw new AppError('Lost opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lostOpportunity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access lost opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      return lostOpportunity;
    } catch (error) {
      logger.error('Get lost opportunity by ID error:', error);
      throw error;
    }
  },

  // Update lost opportunity
  updateLostOpportunity: async (lostOpportunityId, updateData, user) => {
    try {
      const lostOpportunity = await LostOpportunityModel.findById(lostOpportunityId);

      if (!lostOpportunity) {
        throw new AppError('Lost opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lostOpportunity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only update lost opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Store old values for audit
      const oldValues = { ...lostOpportunity };

      await LostOpportunityModel.update(lostOpportunityId, updateData);

      const updatedLostOpportunity = await LostOpportunityModel.findById(lostOpportunityId);

      // Audit log
      await AuditLogModel.create({
        TableName: 'lostopportunity',
        RecordId: lostOpportunityId,
        Action: 'UPDATE',
        OldValues: JSON.stringify(oldValues),
        NewValues: JSON.stringify(updatedLostOpportunity),
        ChangedBy: user.UserId
      });

      logger.info('Lost opportunity updated', { lostOpportunityId, updatedBy: user.UserId });

      return updatedLostOpportunity;
    } catch (error) {
      logger.error('Update lost opportunity error:', error);
      throw error;
    }
  },

  // Delete lost opportunity
  deleteLostOpportunity: async (lostOpportunityId, user) => {
    try {
      const lostOpportunity = await LostOpportunityModel.findById(lostOpportunityId);

      if (!lostOpportunity) {
        throw new AppError('Lost opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // Only Admin can delete
      if (user.RoleId !== ROLES.ADMIN) {
        throw new AppError('Only admins can delete lost opportunity records', HTTP_STATUS.FORBIDDEN);
      }

      await LostOpportunityModel.delete(lostOpportunityId);

      // Audit log
      await AuditLogModel.create({
        TableName: 'lostopportunity',
        RecordId: lostOpportunityId,
        Action: 'DELETE',
        OldValues: JSON.stringify(lostOpportunity),
        NewValues: null,
        ChangedBy: user.UserId
      });

      logger.info('Lost opportunity deleted', { lostOpportunityId, deletedBy: user.UserId });

      return true;
    } catch (error) {
      logger.error('Delete lost opportunity error:', error);
      throw error;
    }
  },

  // Get lost opportunity by opportunity ID
  getLostOpportunityByOpportunityId: async (opportunityId, user) => {
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);

      if (!opportunity) {
        throw new AppError('Opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (opportunity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access lost opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const lostOpportunity = await LostOpportunityModel.findByOpportunityId(opportunityId);

      if (!lostOpportunity) {
        throw new AppError('Lost opportunity record not found', HTTP_STATUS.NOT_FOUND);
      }

      return lostOpportunity;
    } catch (error) {
      logger.error('Get lost opportunity by opportunity ID error:', error);
      throw error;
    }
  },

  // Get loss analysis
  getLossAnalysis: async (user) => {
    try {
      const analysis = await LostOpportunityModel.getLossAnalysis(user.UserId, user.RoleId);

      return {
        lossReasons: analysis.byReason,
        topCompetitors: analysis.byCompetitor,
        totalLost: analysis.byReason.reduce((sum, item) => sum + item.Count, 0),
        totalLostValue: analysis.byReason.reduce((sum, item) => sum + parseFloat(item.TotalValue), 0)
      };
    } catch (error) {
      logger.error('Get loss analysis error:', error);
      throw error;
    }
  },

  // Get loss reasons
  getLossReasons: () => {
    return LostOpportunityService.LOSS_REASONS;
  }
};

module.exports = LostOpportunityService;