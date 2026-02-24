const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LostOpportunityModel = {
  // Create lost opportunity
  create: async (lostData,connection = null) => {
    const executor = connection ?? pool;
    try {
      const {
        OpportunityId,
        LostReason,
        DetailedReason,
        CompetitorName,
        CompetitorPrice,
        LostToCompetitor,
        ClientFeedback,
        LessonsLearned,
        FollowUpPlan,
        PotentialFutureOpportunity,
        RevisitDate,
        RecordedByUserId
      } = lostData;

      const [result] = await executor.query(
        `INSERT INTO lostopportunity (
          OpportunityId, LostReason, DetailedReason, CompetitorName,
          CompetitorPrice, LostToCompetitor, ClientFeedback, LessonsLearned,
          FollowUpPlan, PotentialFutureOpportunity, RevisitDate, LostDate,
          RecordedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 0, NOW(), NOW())`,
        [
          OpportunityId, LostReason, DetailedReason, CompetitorName,
          CompetitorPrice, LostToCompetitor || 0, ClientFeedback, LessonsLearned,
          FollowUpPlan, PotentialFutureOpportunity || 0, RevisitDate,
          RecordedByUserId
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating lost opportunity:', error);
      throw error;
    }
  },

  // Find lost opportunity by ID
  findById: async (lostOpportunityId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          lo.*,
          o.OpportunityNumber,
          o.OpportunityName,
          o.EstimatedValue,
          o.Currency,
          l.LeadNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          u.Name as RecordedByName
         FROM lostopportunity lo
         LEFT JOIN opportunity o ON lo.OpportunityId = o.OpportunityId
         LEFT JOIN leads l ON o.LeadId = l.LeadId
         LEFT JOIN users u ON lo.RecordedByUserId = u.UserId
         WHERE lo.LostOpportunityId = ? AND lo.IsDeleted = 0`,
        [lostOpportunityId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lost opportunity by ID:', error);
      throw error;
    }
  },

  // Get all lost opportunities
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        lostReason,
        competitorName,
        assignedToUserId,
        potentialFutureOpportunity,
        search
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          lo.LostOpportunityId,
          lo.LostReason,
          lo.CompetitorName,
          lo.PotentialFutureOpportunity,
          lo.RevisitDate,
          lo.LostDate,
          o.OpportunityId,
          o.OpportunityNumber,
          o.OpportunityName,
          o.EstimatedValue,
          o.Currency,
          l.LeadNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          u.Name as RecordedByName
        FROM lostopportunity lo
        LEFT JOIN opportunity o ON lo.OpportunityId = o.OpportunityId
        LEFT JOIN leads l ON o.LeadId = l.LeadId
        LEFT JOIN users u ON lo.RecordedByUserId = u.UserId
        WHERE lo.IsDeleted = 0
      `;

      const params = [];

      if (lostReason) {
        query += ' AND lo.LostReason = ?';
        params.push(lostReason);
      }

      if (competitorName) {
        query += ' AND lo.CompetitorName LIKE ?';
        params.push(`%${competitorName}%`);
      }

      if (assignedToUserId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(assignedToUserId);
      }

      if (potentialFutureOpportunity !== undefined) {
        query += ' AND lo.PotentialFutureOpportunity = ?';
        params.push(potentialFutureOpportunity);
      }

      if (search) {
        query += ' AND (o.OpportunityName LIKE ? OR l.CustomerName LIKE ? OR l.CompanyName LIKE ?)';
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
        lostOpportunities: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all lost opportunities:', error);
      throw error;
    }
  },

  // Update lost opportunity
  update: async (lostOpportunityId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'DetailedReason', 'ClientFeedback', 'LessonsLearned',
        'FollowUpPlan', 'PotentialFutureOpportunity', 'RevisitDate'
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
      params.push(lostOpportunityId);

      const [result] = await pool.query(
        `UPDATE lostopportunity SET ${fields.join(', ')} WHERE LostOpportunityId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lost opportunity:', error);
      throw error;
    }
  },

  // Delete lost opportunity (soft delete)
  delete: async (lostOpportunityId) => {
    try {
      const [result] = await pool.query(
        `UPDATE lostopportunity 
         SET IsDeleted = 1, UpdatedAt = NOW() 
         WHERE LostOpportunityId = ?`,
        [lostOpportunityId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting lost opportunity:', error);
      throw error;
    }
  },

  // Find by opportunity ID
  findByOpportunityId: async (opportunityId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          lo.*,
          u.Name as RecordedByName
         FROM lostopportunity lo
         LEFT JOIN users u ON lo.RecordedByUserId = u.UserId
         WHERE lo.OpportunityId = ? AND lo.IsDeleted = 0`,
        [opportunityId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lost opportunity by opportunity ID:', error);
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
          lo.LostReason,
          COUNT(*) as Count,
          COALESCE(SUM(o.EstimatedValue), 0) as TotalValue
        FROM lostopportunity lo
        LEFT JOIN opportunity o ON lo.OpportunityId = o.OpportunityId
      `;

      const params = [];

      if (roleId === ROLES.SALES_PERSON && userId) {
        reasonQuery += ` LEFT JOIN leads l ON o.LeadId = l.LeadId
                         WHERE l.AssignedToUserId = ? AND lo.IsDeleted = 0`;
        params.push(userId);
      } else {
        reasonQuery += ' WHERE lo.IsDeleted = 0';
      }

      reasonQuery += ' GROUP BY lo.LostReason ORDER BY Count DESC';

      const [reasonRows] = await pool.query(reasonQuery, params);

      // Analysis by competitor
      let competitorQuery = `
        SELECT 
          lo.CompetitorName,
          COUNT(*) as Count,
          COALESCE(SUM(o.EstimatedValue), 0) as TotalValue
        FROM lostopportunity lo
        LEFT JOIN opportunity o ON lo.OpportunityId = o.OpportunityId
      `;

      const competitorParams = [];

      if (roleId === ROLES.SALES_PERSON && userId) {
        competitorQuery += ` LEFT JOIN leads l ON o.LeadId = l.LeadId
                             WHERE l.AssignedToUserId = ? 
                             AND lo.IsDeleted = 0 
                             AND lo.CompetitorName IS NOT NULL
                             AND lo.CompetitorName != ''`;
        competitorParams.push(userId);
      } else {
        competitorQuery += ` WHERE lo.IsDeleted = 0 
                             AND lo.CompetitorName IS NOT NULL
                             AND lo.CompetitorName != ''`;
      }

      competitorQuery += ' GROUP BY lo.CompetitorName ORDER BY Count DESC LIMIT 10';

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

module.exports = LostOpportunityModel;