const { pool } = require('../config/database');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const ProposalModel = {
  // Create proposal
  create: async (proposalData, connection = null) => {
    try {
      const db = connection || pool;
      const {
        DealId,
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

      const [result] = await db.query(
        `INSERT INTO proposal (
          ProposalNumber, DealId, ProposalTitle, ProposalAmount,
          Currency, ProposalDocumentPath, VersionNo, ParentProposalId,
          ValidityDate, PaymentTerms, DeliveryTerms, InternalNotes,
          ContentHash, ProposalStatusId, CreatedBy,
          IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          ProposalNumber,
          DealId,
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
  findById: async (proposalId, connection = null) => {
    try {
      const db = connection || pool;
      const [rows] = await db.query(
        `SELECT 
          p.*,
          ps.StatusName as ProposalStatusName,
          d.DealId,
          d.DealNumber,
          d.DealName,
          d.Amount as DealAmount,
          d.AssignedToUserId,
          ds.StageName as DealStageName,
          a.AccountName,
          c.FirstName as ContactFirstName,
          c.LastName as ContactLastName,
          c.Email as CustomerEmail,
          creator.Name as CreatedByName,
          approver.Name as ApprovedByName
         FROM proposal p
         LEFT JOIN proposalstatus ps ON p.ProposalStatusId = ps.ProposalStatusId
         LEFT JOIN deals d ON p.DealId = d.DealId
         LEFT JOIN dealstage ds ON d.DealStageId = ds.DealStageId
         LEFT JOIN accounts a ON d.AccountId = a.AccountId
         LEFT JOIN contacts c ON d.ContactId = c.ContactId
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
        dealId,
        proposalStatusId,
        assignedToUserId,
        createdBy,
        maxAmount,
        minAmount,
        search,
        excludeConverted,
        excludeAppointmentId // will help for exclude proposal which already in proposal appointment table for this given appointment id. (will used in appointment page attach proposal action when fetching proposals)
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
          p.ParentProposalId,
          p.ValidityDate,
          p.SubmittedAt,
          p.ApprovedAt,
          p.RejectedAt,
          p.RejectionReason,
          p.PaymentTerms,
          p.DeliveryTerms,
          p.InternalNotes,
          p.ProposalDocumentPath,
          p.ProposalStatusId,
          p.CreatedAt,
          ps.StatusName as ProposalStatusName,
          p.DealId,
          d.DealNumber,
          d.DealName,
          d.AssignedToUserId,
          ds.StageName as DealStageName,
          a.AccountName,
          c.FirstName as ContactFirstName,
          c.LastName as ContactLastName,
          creator.Name as CreatedByName,
          approver.Name as ApprovedByName
        FROM proposal p
        LEFT JOIN proposalstatus ps ON p.ProposalStatusId = ps.ProposalStatusId
        LEFT JOIN deals d ON p.DealId = d.DealId
        LEFT JOIN dealstage ds ON d.DealStageId = ds.DealStageId
        LEFT JOIN accounts a ON d.AccountId = a.AccountId
        LEFT JOIN contacts c ON d.ContactId = c.ContactId
        LEFT JOIN users creator ON p.CreatedBy = creator.UserId
        LEFT JOIN users approver ON p.ApprovedByUserId = approver.UserId
        WHERE p.IsDeleted = 0
      `;

      const params = [];

      if (dealId) {
        const ids = Array.isArray(dealId) ? dealId : (typeof dealId === 'string' ? dealId.split(',').map(id => id.trim()) : [dealId]);
        query += ` AND p.DealId IN (${ids.map(() => '?').join(', ')})`;
        params.push(...ids);
      }

      if (proposalStatusId) {
        query += ' AND p.ProposalStatusId = ?';
        params.push(proposalStatusId);
      }

      if (assignedToUserId) {
        query += ' AND d.AssignedToUserId = ?';
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
        query += ' AND (p.ProposalTitle LIKE ? OR d.DealName LIKE ? OR d.DealNumber LIKE ? OR a.AccountName LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (excludeConverted) {
        query += ' AND NOT EXISTS (SELECT 1 FROM salesorder so WHERE so.ProposalId = p.ProposalId AND so.IsDeleted = 0)';
      }

      if (excludeAppointmentId) {
        query += ' AND NOT EXISTS (SELECT 1 FROM proposalappointment pa WHERE pa.ProposalId = p.ProposalId AND pa.AppointmentId = ? AND pa.IsDeleted = 0)';
        params.push(excludeAppointmentId);
      }

      // Get total count
      const countQuery = query.replace(
        /SELECT[\s\S]*?FROM/i,
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
  updateStatus: async (proposalId, statusId, connection = null) => {
    try {
      const db = connection || pool;  // 👈 use transaction connection if provided
      const [result] = await db.query(
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

  // Get proposals by deal
  getByDealId: async (dealId) => {
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
         WHERE p.DealId = ? AND p.IsDeleted = 0
         ORDER BY p.VersionNo DESC, p.CreatedAt DESC`,
        [dealId]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting proposals by deal:', error);
      throw error;
    }
  },

  hasOtherActiveProposalsForDeal: async (dealId, proposalId, connection = null) => {
    try {
      const db = connection || pool;
      const [rows] = await db.query(
        `SELECT 1
         FROM proposal
         WHERE DealId = ?
         AND ProposalId <> ?
         AND ProposalStatusId NOT IN (5, 6)
         AND IsDeleted = 0
         LIMIT 1`,
        [dealId, proposalId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking active proposals by deal:', error);
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
          p.PaymentTerms,
          p.DeliveryTerms,
          p.InternalNotes,
          d.DealNumber,
          d.DealName,
          a.AccountName,
          c.FirstName as ContactFirstName,
          c.LastName as ContactLastName,
          creator.Name as CreatedByName
        FROM proposal p
        LEFT JOIN deals d ON p.DealId = d.DealId
        LEFT JOIN accounts a ON d.AccountId = a.AccountId
        LEFT JOIN contacts c ON d.ContactId = c.ContactId
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
          p.PaymentTerms,
          p.DeliveryTerms,
          p.InternalNotes,
          DATEDIFF(p.ValidityDate, CURDATE()) as DaysRemaining,
          d.DealNumber,
          d.DealName,
          d.AssignedToUserId
        FROM proposal p
        LEFT JOIN deals d ON p.DealId = d.DealId
        WHERE p.ProposalStatusId = 2
        AND p.ValidityDate >= CURDATE()
        AND p.ValidityDate <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND p.IsDeleted = 0
      `;

      const params = [days];

      // Sales Person sees only their proposals
      if (roleId === ROLES.SALES_PERSON && userId) {
        query += ' AND d.AssignedToUserId = ?';
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

  findByDealAndHash: async (dealId, contentHash) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT ProposalId
        FROM proposal
        WHERE DealId = ?
          AND ContentHash = ?
          AND IsDeleted = 0
        LIMIT 1
        `,
        [dealId, contentHash]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error checking proposal content hash:', error);
      throw error;
    }
  },

  findByDealAndHashExcludingSelf: async (
    dealId,
    contentHash,
    proposalId
  ) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT ProposalId
        FROM proposal
        WHERE DealId = ?
          AND ContentHash = ?
          AND ProposalId <> ?
          AND IsDeleted = 0
        LIMIT 1
        `,
        [dealId, contentHash, proposalId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error checking duplicate proposal hash:', error);
      throw error;
    }
  },


  // Get highest version number for deal
  getMaxVersionNo: async (dealId) => {
    try {
      const [rows] = await pool.query(
        'SELECT COALESCE(MAX(VersionNo), 0) as MaxVersion FROM proposal WHERE DealId = ?',
        [dealId]
      );

      return rows[0].MaxVersion;
    } catch (error) {
      logger.error('Error getting max version number:', error);
      throw error;
    }
  },

  // Set other proposals for a deal to Expired / RejectedExpired
  expireOtherProposals: async (dealId, approvedProposalId, connection = null) => {
    try {
      const db = connection || pool;

      const [result] = await db.query(
        `UPDATE proposal 
        SET 
          ProposalStatusId = CASE
            WHEN ProposalStatusId = 5 THEN 7
            ELSE 6
          END,
          UpdatedAt = NOW()
        WHERE DealId = ? 
        AND ProposalId <> ? 
        AND ProposalStatusId NOT IN (4, 6, 7)
        AND IsDeleted = 0`,
        [dealId, approvedProposalId]
      );

      logger.info(`Expired ${result.affectedRows} sibling proposals for deal ${dealId}`);

      return result.affectedRows;

    } catch (error) {
      logger.error('Error expiring sibling proposals:', error);
      throw error;
    }
  },
  getAccountIdByProposalId: async (proposalId, connection = null) => {
    try {
      const db = connection || pool;
      const [rows] = await db.query(
        `SELECT d.AccountId
         FROM proposal p
         JOIN deals d ON p.DealId = d.DealId
         WHERE p.ProposalId = ? AND p.IsDeleted = 0
         LIMIT 1`,
        [proposalId]
      );
      return rows[0]?.AccountId || null;
    } catch (error) {
      logger.error('Error getting AccountId by ProposalId:', error);
      throw error;
    }
  },
  // Check if deal already has an active submitted/approved proposal
  hasActiveSubmittedProposal: async (dealId, excludeProposalId, connection = null) => {
    try {
      const db = connection || pool;
      const [rows] = await db.query(
        `SELECT ProposalId, ProposalNumber, ProposalStatusId
        FROM proposal
        WHERE DealId = ?
          AND ProposalId <> ?
          AND ProposalStatusId IN (2, 3, 4)
          AND IsDeleted = 0
        LIMIT 1`,
        [dealId, excludeProposalId]
      );

      return rows[0] || null; // returns the conflicting proposal or null
    } catch (error) {
      logger.error('Error checking active submitted proposal for deal:', error);
      throw error;
    }
  }


};

module.exports = ProposalModel;
