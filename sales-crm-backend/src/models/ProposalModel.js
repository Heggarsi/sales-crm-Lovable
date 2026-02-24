const { pool } = require('../config/database');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const ProposalModel = {
  // Create proposal
  create: async (proposalData) => {
    try {
      const {
        OpportunityId,
        ProposalTitle,
        ProposalAmount,
        Currency,
        ProposalDocumentPath,
        VersionNo,
        ParentProposalId,
        ValidityDate,
        PaymentTerms,
        DeliveryTerms,
        InternalNotes,
        ProposalStatusId,
        ContentHash,
        CreatedBy
      } = proposalData;
  
      const ProposalNumber = helpers.generateUniqueNumber('PROP');
  
      const [result] = await pool.query(
        `INSERT INTO proposal (
          ProposalNumber, OpportunityId, ProposalTitle, ProposalAmount,
          Currency, ProposalDocumentPath, VersionNo, ParentProposalId,
          ValidityDate, PaymentTerms, DeliveryTerms, InternalNotes,
          ContentHash, ProposalStatusId, CreatedBy,
          IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          ProposalNumber,
          OpportunityId,
          ProposalTitle,
          ProposalAmount,
          Currency,
          ProposalDocumentPath || null,
          VersionNo,
          ParentProposalId || null,
          ValidityDate,
          PaymentTerms || null,
          DeliveryTerms || null,
          InternalNotes || null,
          ContentHash,
          ProposalStatusId || 1,
          CreatedBy
        ]
      );
  
      return result.insertId;
    } catch (error) {
      logger.error('Error creating proposal:', error);
      throw error;
    }
  },
  

  // Find proposal by ID
  findById: async (proposalId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          p.*,
          ps.StatusName as ProposalStatusName,
          o.OpportunityId,
          o.OpportunityNumber,
          o.OpportunityName,
          o.EstimatedValue,
          l.LeadId,
          l.LeadNumber,
          l.CustomerName,
          l.Email as CustomerEmail,
          l.CompanyName,
          l.AssignedToUserId,
          creator.Name as CreatedByName,
          approver.Name as ApprovedByName
         FROM proposal p
         LEFT JOIN proposalstatus ps ON p.ProposalStatusId = ps.ProposalStatusId
         LEFT JOIN opportunity o ON p.OpportunityId = o.OpportunityId
         LEFT JOIN leads l ON o.LeadId = l.LeadId
         LEFT JOIN users creator ON p.CreatedBy = creator.UserId
         LEFT JOIN users approver ON p.ApprovedByUserId = approver.UserId
         WHERE p.ProposalId = ? AND p.IsDeleted = 0`,
        [proposalId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding proposal by ID:', error);
      throw error;
    }
  },

  // Get all proposals with filters
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        opportunityId,
        proposalStatusId,
        assignedToUserId,
        createdBy,
        minAmount,
        maxAmount,
        search
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          p.ProposalId,
          p.ProposalNumber,
          p.ProposalTitle,
          p.ProposalAmount,
          p.Currency,
          p.VersionNo,
          p.ValidityDate,
          p.SubmittedAt,
          p.ProposalStatusId,
          p.CreatedAt,
          ps.StatusName as ProposalStatusName,
          o.OpportunityNumber,
          o.OpportunityName,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          creator.Name as CreatedByName,
          approver.Name as ApprovedByName
        FROM proposal p
        LEFT JOIN proposalstatus ps ON p.ProposalStatusId = ps.ProposalStatusId
        LEFT JOIN opportunity o ON p.OpportunityId = o.OpportunityId
        LEFT JOIN leads l ON o.LeadId = l.LeadId
        LEFT JOIN users creator ON p.CreatedBy = creator.UserId
        LEFT JOIN users approver ON p.ApprovedByUserId = approver.UserId
        WHERE p.IsDeleted = 0
      `;

      const params = [];

      if (opportunityId) {
        query += ' AND p.OpportunityId = ?';
        params.push(opportunityId);
      }

      if (proposalStatusId) {
        query += ' AND p.ProposalStatusId = ?';
        params.push(proposalStatusId);
      }

      if (assignedToUserId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(assignedToUserId);
      }

      if (createdBy) {
        query += ' AND p.CreatedBy = ?';
        params.push(createdBy);
      }

      if (minAmount) {
        query += ' AND p.ProposalAmount >= ?';
        params.push(minAmount);
      }

      if (maxAmount) {
        query += ' AND p.ProposalAmount <= ?';
        params.push(maxAmount);
      }

      if (search) {
        query += ' AND (p.ProposalTitle LIKE ? OR l.CustomerName LIKE ? OR l.CompanyName LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const countQuery = query.replace(
        /SELECT[\s\S]*FROM/,
        'SELECT COUNT(*) as total FROM'
      );
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated results
      query += ' ORDER BY p.CreatedAt DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        proposals: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all proposals:', error);
      throw error;
    }
  },

  // Update proposal
  update: async (proposalId, updateData) => {
    try {
      const fields = [];
      const params = [];
  
      const allowedFields = [
        'ProposalTitle',
        'ProposalAmount',
        'Currency',
        'ProposalDocumentPath',
        'ValidityDate',
        'PaymentTerms',
        'DeliveryTerms',
        'InternalNotes',
        'ContentHash' // 👈 allow hash update
      ];
  
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      });
  
      if (fields.length === 0) {
        return false;
      }
  
      fields.push('UpdatedAt = NOW()');
      params.push(proposalId);
  
      const [result] = await pool.query(
        `UPDATE proposal SET ${fields.join(', ')} WHERE ProposalId = ?`,
        params
      );
  
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating proposal:', error);
      throw error;
    }
  },
  

  // Update status
  updateStatus: async (proposalId, statusId) => {
    try {
      const [result] = await pool.query(
        `UPDATE proposal 
         SET ProposalStatusId = ?, UpdatedAt = NOW() 
         WHERE ProposalId = ?`,
        [statusId, proposalId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating proposal status:', error);
      throw error;
    }
  },

  // Submit proposal
  submit: async (proposalId) => {
    try {
      const [result] = await pool.query(
        `UPDATE proposal 
         SET ProposalStatusId = 2, SubmittedAt = NOW(), UpdatedAt = NOW() 
         WHERE ProposalId = ?`,
        [proposalId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error submitting proposal:', error);
      throw error;
    }
  },

  // Approve proposal
  approve: async (proposalId, approvedByUserId) => {
    try {
      const [result] = await pool.query(
        `UPDATE proposal 
         SET ProposalStatusId = 4, 
             ApprovedByUserId = ?,
             ApprovedAt = NOW(),
             DecisionDate = NOW(),
             UpdatedAt = NOW()
         WHERE ProposalId = ?`,
        [approvedByUserId, proposalId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error approving proposal:', error);
      throw error;
    }
  },

  // Reject proposal
  reject: async (proposalId, rejectionReason) => {
    try {
      const [result] = await pool.query(
        `UPDATE proposal 
         SET ProposalStatusId = 5,
             RejectedAt = NOW(),
             RejectionReason = ?,
             DecisionDate = NOW(),
             UpdatedAt = NOW()
         WHERE ProposalId = ?`,
        [rejectionReason, proposalId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error rejecting proposal:', error);
      throw error;
    }
  },

  // Delete proposal (soft delete)
  delete: async (proposalId) => {
    try {
      const [result] = await pool.query(
        `UPDATE proposal 
         SET IsDeleted = 1, UpdatedAt = NOW() 
         WHERE ProposalId = ?`,
        [proposalId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting proposal:', error);
      throw error;
    }
  },

  // Get proposals by opportunity
  getByOpportunityId: async (opportunityId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          p.*,
          ps.StatusName as ProposalStatusName,
          creator.Name as CreatedByName,
          approver.Name as ApprovedByName
         FROM proposal p
         LEFT JOIN proposalstatus ps ON p.ProposalStatusId = ps.ProposalStatusId
         LEFT JOIN users creator ON p.CreatedBy = creator.UserId
         LEFT JOIN users approver ON p.ApprovedByUserId = approver.UserId
         WHERE p.OpportunityId = ? AND p.IsDeleted = 0
         ORDER BY p.VersionNo DESC, p.CreatedAt DESC`,
        [opportunityId]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting proposals by opportunity:', error);
      throw error;
    }
  },

  // Check if proposal is in draft
  isDraft: async (proposalId) => {
    try {
      const [rows] = await pool.query(
        'SELECT ProposalStatusId FROM proposal WHERE ProposalId = ? AND IsDeleted = 0',
        [proposalId]
      );

      if (rows.length === 0) return false;

      // Status 1 = Draft
      return rows[0].ProposalStatusId === 1;
    } catch (error) {
      logger.error('Error checking if proposal is draft:', error);
      throw error;
    }
  },

  // Check if proposal is approved
  isApproved: async (proposalId) => {
    try {
      const [rows] = await pool.query(
        'SELECT ProposalStatusId FROM proposal WHERE ProposalId = ? AND IsDeleted = 0',
        [proposalId]
      );

      if (rows.length === 0) return false;

      // Status 4 = Approved
      return rows[0].ProposalStatusId === 4;
    } catch (error) {
      logger.error('Error checking if proposal is approved:', error);
      throw error;
    }
  },

  // Check if proposal is rejected
  isRejected: async (proposalId) => {
    try {
      const [rows] = await pool.query(
        'SELECT ProposalStatusId FROM proposal WHERE ProposalId = ? AND IsDeleted = 0',
        [proposalId]
      );

      if (rows.length === 0) return false;

      // Status 5 = Rejected
      return rows[0].ProposalStatusId === 5;
    } catch (error) {
      logger.error('Error checking if proposal is rejected:', error);
      throw error;
    }
  },

  // Get pending approvals (for managers)
  getPendingApprovals: async (userId = null, roleId = null) => {
    try {
      const ROLES = require('../config/constants').ROLES;

      let query = `
        SELECT 
          p.ProposalId,
          p.ProposalNumber,
          p.ProposalTitle,
          p.ProposalAmount,
          p.Currency,
          p.SubmittedAt,
          o.OpportunityNumber,
          o.OpportunityName,
          l.CustomerName,
          l.CompanyName,
          creator.Name as CreatedByName
        FROM proposal p
        LEFT JOIN opportunity o ON p.OpportunityId = o.OpportunityId
        LEFT JOIN leads l ON o.LeadId = l.LeadId
        LEFT JOIN users creator ON p.CreatedBy = creator.UserId
        WHERE p.ProposalStatusId IN (2, 3) AND p.IsDeleted = 0
      `;

      // Sales Person cannot see pending approvals (only managers)
      if (roleId === ROLES.SALES_PERSON) {
        return [];
      }

      query += ' ORDER BY p.SubmittedAt ASC';

      const [rows] = await pool.query(query);

      return rows;
    } catch (error) {
      logger.error('Error getting pending approvals:', error);
      throw error;
    }
  },

  // Get expiring proposals
  getExpiringSoon: async (days = 7, userId = null, roleId = null) => {
    try {
      const ROLES = require('../config/constants').ROLES;

      let query = `
        SELECT 
          p.ProposalId,
          p.ProposalNumber,
          p.ProposalTitle,
          p.ValidityDate,
          DATEDIFF(p.ValidityDate, CURDATE()) as DaysRemaining,
          o.OpportunityNumber,
          l.CustomerName,
          l.AssignedToUserId
        FROM proposal p
        LEFT JOIN opportunity o ON p.OpportunityId = o.OpportunityId
        LEFT JOIN leads l ON o.LeadId = l.LeadId
        WHERE p.ProposalStatusId = 2
        AND p.ValidityDate >= CURDATE()
        AND p.ValidityDate <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND p.IsDeleted = 0
      `;

      const params = [days];

      // Sales Person sees only their proposals
      if (roleId === ROLES.SALES_PERSON && userId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(userId);
      }

      query += ' ORDER BY p.ValidityDate ASC';

      const [rows] = await pool.query(query, params);

      return rows;
    } catch (error) {
      logger.error('Error getting expiring proposals:', error);
      throw error;
    }
  },

  // Auto-expire proposals
  autoExpireProposals: async () => {
    try {
      const [result] = await pool.query(
        `UPDATE proposal 
         SET ProposalStatusId = 6, UpdatedAt = NOW()
         WHERE ProposalStatusId = 2 
         AND ValidityDate < CURDATE()
         AND IsDeleted = 0`
      );

      logger.info(`Auto-expired ${result.affectedRows} proposals`);

      return result.affectedRows;
    } catch (error) {
      logger.error('Error auto-expiring proposals:', error);
      throw error;
    }
  },

  findByOpportunityAndHash: async (opportunityId, contentHash) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT ProposalId
        FROM proposal
        WHERE OpportunityId = ?
          AND ContentHash = ?
          AND IsDeleted = 0
        LIMIT 1
        `,
        [opportunityId, contentHash]
      );
  
      return rows[0] || null;
    } catch (error) {
      logger.error('Error checking proposal content hash:', error);
      throw error;
    }
  },
  
  findByOpportunityAndHashExcludingSelf: async (
    opportunityId,
    contentHash,
    proposalId
  ) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT ProposalId
        FROM proposal
        WHERE OpportunityId = ?
          AND ContentHash = ?
          AND ProposalId <> ?
          AND IsDeleted = 0
        LIMIT 1
        `,
        [opportunityId, contentHash, proposalId]
      );
  
      return rows[0] || null;
    } catch (error) {
      logger.error('Error checking duplicate proposal hash:', error);
      throw error;
    }
  },
  

  // Get highest version number for opportunity
  getMaxVersionNo: async (opportunityId) => {
    try {
      const [rows] = await pool.query(
        'SELECT COALESCE(MAX(VersionNo), 0) as MaxVersion FROM proposal WHERE OpportunityId = ?',
        [opportunityId]
      );

      return rows[0].MaxVersion;
    } catch (error) {
      logger.error('Error getting max version number:', error);
      throw error;
    }
  }
};

module.exports = ProposalModel;