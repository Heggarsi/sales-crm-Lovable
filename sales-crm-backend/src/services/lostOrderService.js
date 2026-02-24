const LostOrderModel = require('../models/LostOrderModel');
const ProposalModel = require('../models/ProposalModel');
const OpportunityModel = require('../models/OpportunityModel');
const ActivityLogModel = require('../models/ActivityLogModel');
const AuditLogModel = require('../models/AuditLogModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const { pool } = require('../config/database');

const LostOrderService = {
  // Predefined rejection reasons
  REJECTION_REASONS: [
    'Pricing too high',
    'Insufficient features',
    'Client chose competitor',
    'Budget constraints',
    'Timeline concerns',
    'Technical limitations',
    'Poor proposal quality',
    'Client relationship issues',
    'Decision maker changed',
    'Project cancelled',
    'Other'
  ],

  // Reject proposal and create lost order
  rejectProposal: async (proposalId, rejectionData, user) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // Only Manager/Admin can reject
      if (user.RoleId === ROLES.SALES_PERSON) {
        throw new AppError('Sales persons cannot reject proposals', HTTP_STATUS.FORBIDDEN);
      }

      // Must be in Submitted or Under Review status
      if (proposal.ProposalStatusId !== 2 && proposal.ProposalStatusId !== 3) {
        throw new AppError('Only submitted or under review proposals can be rejected', HTTP_STATUS.BAD_REQUEST);
      }

      // Cannot reject own proposal (conflict of interest)
      if (proposal.CreatedBy === user.UserId) {
        throw new AppError('You cannot reject your own proposal', HTTP_STATUS.FORBIDDEN);
      }

      // Validate rejection reason
      if (!rejectionData.Reason) {
        throw new AppError('Rejection reason is required', HTTP_STATUS.BAD_REQUEST);
      }

      // Reject proposal
      await connection.query(
        `UPDATE proposal 
         SET ProposalStatusId = 5,
             RejectedAt = NOW(),
             RejectionReason = ?,
             DecisionDate = NOW(),
             UpdatedAt = NOW()
         WHERE ProposalId = ?`,
        [rejectionData.Reason, proposalId]
      );

      // Create lost order record
      const lostOrderId = await LostOrderModel.create({
        ProposalId: proposalId,
        Reason: rejectionData.Reason,
        DetailedFeedback: rejectionData.DetailedFeedback,
        CompetitorWon: rejectionData.CompetitorWon
      },connection);

      // Log activity
      await connection.query(
        `INSERT INTO activitylog (
          LeadId, ActivityTypeId, Subject, Description, Direction,
          Outcome, ActivityDate, CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, 4, ?, ?, 'Internal', 'Rejected', NOW(), ?, 0, NOW(), NOW())`,
        [
          proposal.LeadId,
          `Proposal Rejected: ${proposal.ProposalTitle}`,
          `Proposal rejected. Reason: ${rejectionData.Reason}. ${rejectionData.DetailedFeedback || ''}`,
          user.UserId
        ]
      );

      // Audit log
      await connection.query(
        `INSERT INTO auditlog (
          TableName, RecordId, Action, OldValues, NewValues, ChangedBy, ChangedAt
        ) VALUES ('proposal', ?, 'REJECT', ?, ?, ?, NOW())`,
        [
          proposalId,
          JSON.stringify({ ProposalStatusId: proposal.ProposalStatusId }),
          JSON.stringify({ 
            ProposalStatusId: 5,
            RejectionReason: rejectionData.Reason 
          }),
          user.UserId
        ]
      );

      await connection.commit();

      const updatedProposal = await ProposalModel.findById(proposalId);
      const lostOrder = await LostOrderModel.findById(lostOrderId);

      logger.info('Proposal rejected', { 
        proposalId, 
        lostOrderId,
        rejectedBy: user.UserId 
      });

      return {
        proposal: updatedProposal,
        lostOrder: lostOrder,
        message: 'Proposal rejected successfully',
        canCreateRevision: true
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Reject proposal error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get all lost orders
  getAllLostOrders: async (filters, user) => {
    try {
      // Sales Person can only see lost orders for their leads
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
      }

      const result = await LostOrderModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.lostOrders,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all lost orders error:', error);
      throw error;
    }
  },

  // Get lost order by ID
  getLostOrderById: async (lostOrderId, user) => {
    try {
      const lostOrder = await LostOrderModel.findById(lostOrderId);

      if (!lostOrder) {
        throw new AppError('Lost order not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lostOrder.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access lost orders for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      return lostOrder;
    } catch (error) {
      logger.error('Get lost order by ID error:', error);
      throw error;
    }
  },

  // Update lost order
  updateLostOrder: async (lostOrderId, updateData, user) => {
    try {
      const lostOrder = await LostOrderModel.findById(lostOrderId);

      if (!lostOrder) {
        throw new AppError('Lost order not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lostOrder.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only update lost orders for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Store old values for audit
      const oldValues = { ...lostOrder };

      await LostOrderModel.update(lostOrderId, updateData);

      const updatedLostOrder = await LostOrderModel.findById(lostOrderId);

      // Audit log
      await AuditLogModel.create({
        TableName: 'lostorder',
        RecordId: lostOrderId,
        Action: 'UPDATE',
        OldValues: JSON.stringify(oldValues),
        NewValues: JSON.stringify(updatedLostOrder),
        ChangedBy: user.UserId
      });

      logger.info('Lost order updated', { lostOrderId, updatedBy: user.UserId });

      return updatedLostOrder;
    } catch (error) {
      logger.error('Update lost order error:', error);
      throw error;
    }
  },

  // Delete lost order
  deleteLostOrder: async (lostOrderId, user) => {
    try {
      const lostOrder = await LostOrderModel.findById(lostOrderId);

      if (!lostOrder) {
        throw new AppError('Lost order not found', HTTP_STATUS.NOT_FOUND);
      }

      // Only Admin can delete
      if (user.RoleId !== ROLES.ADMIN) {
        throw new AppError('Only admins can delete lost order records', HTTP_STATUS.FORBIDDEN);
      }

      await LostOrderModel.delete(lostOrderId);

      // Audit log
      await AuditLogModel.create({
        TableName: 'lostorder',
        RecordId: lostOrderId,
        Action: 'DELETE',
        OldValues: JSON.stringify(lostOrder),
        NewValues: null,
        ChangedBy: user.UserId
      });

      logger.info('Lost order deleted', { lostOrderId, deletedBy: user.UserId });

      return true;
    } catch (error) {
      logger.error('Delete lost order error:', error);
      throw error;
    }
  },

  // Get lost order by proposal ID
  getLostOrderByProposalId: async (proposalId, user) => {
    try {
      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (proposal.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access lost orders for proposals of leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const lostOrder = await LostOrderModel.findByProposalId(proposalId);

      if (!lostOrder) {
        throw new AppError('Lost order record not found for this proposal', HTTP_STATUS.NOT_FOUND);
      }

      return lostOrder;
    } catch (error) {
      logger.error('Get lost order by proposal ID error:', error);
      throw error;
    }
  },

  // Get loss analysis
  getLossAnalysis: async (user) => {
    try {
      const analysis = await LostOrderModel.getLossAnalysis(user.UserId, user.RoleId);

      return {
        rejectionReasons: analysis.byReason,
        topCompetitors: analysis.byCompetitor,
        totalLost: analysis.byReason.reduce((sum, item) => sum + item.Count, 0),
        totalLostValue: analysis.byReason.reduce((sum, item) => sum + parseFloat(item.TotalValue), 0)
      };
    } catch (error) {
      logger.error('Get loss analysis error:', error);
      throw error;
    }
  },

  // Get rejection reasons
  getRejectionReasons: () => {
    return LostOrderService.REJECTION_REASONS;
  }
};

module.exports = LostOrderService;