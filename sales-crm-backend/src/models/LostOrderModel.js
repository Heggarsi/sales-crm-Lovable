const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LostOrderModel = {
  // Create lost order
  create: async (lostData, connection = null) => {
    const executor = connection ?? pool; // use passed connection or fallback to pool

    try {
      const {
        ProposalId,
        Reason,
        DetailedFeedback,
        CompetitorWon
      } = lostData;

      const [result] = await executor.query(
        `INSERT INTO lostorder (
          ProposalId, Reason, DetailedFeedback, CompetitorWon,
          LostDate, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, NOW(), 0, NOW(), NOW())`,
        [
          ProposalId,
          Reason,
          DetailedFeedback,
          CompetitorWon || 0
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating lost order:', error);
      throw error;
    }
  },


  // Find lost order by ID
  findById: async (lostOrderId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          lo.*,
          p.ProposalNumber,
          p.ProposalTitle,
          p.ProposalAmount,
          p.Currency,
          d.DealNumber,
          d.DealName,
          d.AssignedToUserId,
          a.AccountName,
          c.FirstName as ContactFirstName,
          c.LastName as ContactLastName
         FROM lostorder lo
         LEFT JOIN proposal p ON lo.ProposalId = p.ProposalId
         LEFT JOIN deals d ON p.DealId = d.DealId
         LEFT JOIN accounts a ON d.AccountId = a.AccountId
         LEFT JOIN contacts c ON d.ContactId = c.ContactId
         WHERE lo.LostOrderId = ? AND lo.IsDeleted = 0`,
        [lostOrderId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lost order by ID:', error);
      throw error;
    }
  },

  // Get all lost orders
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        reason,
        competitorWon,
        assignedToUserId,
        dealId,
        search
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          lo.LostOrderId,
          lo.Reason,
          lo.CompetitorWon,
          lo.LostDate,
          p.ProposalNumber,
          p.ProposalTitle,
          p.ProposalAmount,
          p.Currency,
          d.DealNumber,
          d.DealName,
          d.AssignedToUserId,
          a.AccountName,
          c.FirstName as ContactFirstName,
          c.LastName as ContactLastName
        FROM lostorder lo
        LEFT JOIN proposal p ON lo.ProposalId = p.ProposalId
        LEFT JOIN deals d ON p.DealId = d.DealId
        LEFT JOIN accounts a ON d.AccountId = a.AccountId
        LEFT JOIN contacts c ON d.ContactId = c.ContactId
        WHERE lo.IsDeleted = 0
      `;

      const params = [];

      if (dealId) {
        const ids = Array.isArray(dealId) ? dealId : (typeof dealId === 'string' ? dealId.split(',').map(id => id.trim()) : [dealId]);
        query += ` AND d.DealId IN (${ids.map(() => '?').join(', ')})`;
        params.push(...ids);
      }

      if (reason) {
        query += ' AND lo.Reason = ?';
        params.push(reason);
      }

      if (competitorWon) {
        query += ' AND lo.CompetitorWon LIKE ?';
        params.push(`%${competitorWon}%`);
      }

      if (assignedToUserId) {
        query += ' AND d.AssignedToUserId = ?';
        params.push(assignedToUserId);
      }

      if (search) {
        query += ' AND (p.ProposalTitle LIKE ? OR d.DealName LIKE ? OR d.DealNumber LIKE ? OR a.AccountName LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const countQuery = query.replace(
        /SELECT[\s\S]*FROM/,
        'SELECT COUNT(*) as total FROM'
      );
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated results
      query += ' ORDER BY lo.LostDate DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        lostOrders: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all lost orders:', error);
      throw error;
    }
  },

  // Update lost order
  update: async (lostOrderId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = ['DetailedFeedback', 'CompetitorWon'];

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
      params.push(lostOrderId);

      const [result] = await pool.query(
        `UPDATE lostorder SET ${fields.join(', ')} WHERE LostOrderId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lost order:', error);
      throw error;
    }
  },

  // Delete lost order
  delete: async (lostOrderId) => {
    try {
      const [result] = await pool.query(
        'UPDATE lostorder SET IsDeleted = 1, UpdatedAt = NOW() WHERE LostOrderId = ?',
        [lostOrderId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting lost order:', error);
      throw error;
    }
  },

  // Find by proposal ID
  findByProposalId: async (proposalId) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM lostorder WHERE ProposalId = ? AND IsDeleted = 0`,
        [proposalId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lost order by proposal ID:', error);
      throw error;
    }
  },

  // Get loss analysis
  getLossAnalysis: async (userId = null, roleId = null) => {
    try {
      const ROLES = require('../config/constants').ROLES;
      const DEAL_STAGE = require('../config/constants').DEAL_STAGE;

      // Analysis by reason
      let reasonQuery = `
        SELECT 
          lo.Reason,
          COUNT(*) as Count,
          COALESCE(SUM(p.ProposalAmount), 0) as TotalValue
        FROM lostorder lo
        LEFT JOIN proposal p ON lo.ProposalId = p.ProposalId
      `;

      const params = [];

      if (roleId === ROLES.SALES_PERSON && userId) {
        reasonQuery += ` LEFT JOIN deals d ON p.DealId = d.DealId
                        WHERE d.AssignedToUserId = ? AND lo.IsDeleted = 0`;
        params.push(userId);
      } else {
        reasonQuery += ' WHERE lo.IsDeleted = 0';
      }

      reasonQuery += ' GROUP BY lo.Reason ORDER BY Count DESC';

      const [reasonRows] = await pool.query(reasonQuery, params);

      // Analysis by competitor
      let competitorQuery = `
        SELECT 
          lo.CompetitorWon,
          COUNT(*) as Count,
          COALESCE(SUM(p.ProposalAmount), 0) as TotalValue
        FROM lostorder lo
        LEFT JOIN proposal p ON lo.ProposalId = p.ProposalId
      `;

      const competitorParams = [];

      if (roleId === ROLES.SALES_PERSON && userId) {
        competitorQuery += ` LEFT JOIN deals d ON p.DealId = d.DealId
                            WHERE d.AssignedToUserId = ? 
                            AND lo.IsDeleted = 0 
                            AND lo.CompetitorWon IS NOT NULL
                            AND lo.CompetitorWon != ''`;
        competitorParams.push(userId);
      } else {
        competitorQuery += ` WHERE lo.IsDeleted = 0 
                            AND lo.CompetitorWon IS NOT NULL
                            AND lo.CompetitorWon != ''`;
      }

      competitorQuery += ' GROUP BY lo.CompetitorWon ORDER BY Count DESC LIMIT 10';

      const [competitorRows] = await pool.query(competitorQuery, competitorParams);

      // Fetch won/lost deal counts from deals table
      let dealsCountQuery = `
        SELECT
          SUM(CASE WHEN DealStageId = ? THEN 1 ELSE 0 END) as wonDeals,
          SUM(CASE WHEN DealStageId = ? THEN 1 ELSE 0 END) as lostDeals
        FROM deals
        WHERE IsDeleted = 0
      `;

      const dealsCountParams = [DEAL_STAGE.CLOSED_WON, DEAL_STAGE.CLOSED_LOST];

      if (roleId === ROLES.SALES_PERSON && userId) {
        dealsCountQuery += ' AND AssignedToUserId = ?';
        dealsCountParams.push(userId);
      }

      const [dealsCountRows] = await pool.query(dealsCountQuery, dealsCountParams);

      const wonDeals = parseInt(dealsCountRows[0]?.wonDeals || 0);
      const lostDeals = parseInt(dealsCountRows[0]?.lostDeals || 0);

      return {
        byReason: reasonRows,
        byCompetitor: competitorRows,
        wonDeals,
        lostDeals
      };
    } catch (error) {
      logger.error('Error getting loss analysis:', error);
      throw error;
    }
  }
};

module.exports = LostOrderModel;
