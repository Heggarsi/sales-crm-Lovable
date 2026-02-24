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
          o.OpportunityNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId
         FROM lostorder lo
         LEFT JOIN proposal p ON lo.ProposalId = p.ProposalId
         LEFT JOIN opportunity o ON p.OpportunityId = o.OpportunityId
         LEFT JOIN leads l ON o.LeadId = l.LeadId
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
          o.OpportunityNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId
        FROM lostorder lo
        LEFT JOIN proposal p ON lo.ProposalId = p.ProposalId
        LEFT JOIN opportunity o ON p.OpportunityId = o.OpportunityId
        LEFT JOIN leads l ON o.LeadId = l.LeadId
        WHERE lo.IsDeleted = 0
      `;

      const params = [];

      if (reason) {
        query += ' AND lo.Reason = ?';
        params.push(reason);
      }

      if (competitorWon) {
        query += ' AND lo.CompetitorWon LIKE ?';
        params.push(`%${competitorWon}%`);
      }

      if (assignedToUserId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(assignedToUserId);
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
        reasonQuery += ` LEFT JOIN opportunity o ON p.OpportunityId = o.OpportunityId
                         LEFT JOIN leads l ON o.LeadId = l.LeadId
                         WHERE l.AssignedToUserId = ? AND lo.IsDeleted = 0`;
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
        competitorQuery += ` LEFT JOIN opportunity o ON p.OpportunityId = o.OpportunityId
                             LEFT JOIN leads l ON o.LeadId = l.LeadId
                             WHERE l.AssignedToUserId = ? 
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

      return {
        byReason: reasonRows,
        byCompetitor: competitorRows
      };
    } catch (error) {
      logger.error('Error getting loss analysis:', error);
      throw error;
    }
  }
};

module.exports = LostOrderModel;