const { pool } = require('../config/database');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const OpportunityModel = {
  // Create opportunity
  create: async (opportunityData) => {
    try {
      const {
        LeadId,
        OpportunityName,
        Description,
        EstimatedValue,
        Currency,
        Probability,
        ExpectedCloseDate,
        CompetitorInfo,
        KeyDecisionMakers,
        OpportunityStageId,
        OpportunityStatusId,
        CreatedByUserId
      } = opportunityData;

      const OpportunityNumber = helpers.generateUniqueNumber('OPP');

      const [result] = await pool.query(
        `INSERT INTO opportunity (
          OpportunityNumber, LeadId, OpportunityName, Description,
          EstimatedValue, Currency, Probability, ExpectedCloseDate,
          CompetitorInfo, KeyDecisionMakers, OpportunityStageId,
          OpportunityStatusId, CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          OpportunityNumber, LeadId, OpportunityName, Description,
          EstimatedValue, Currency, Probability || 30, ExpectedCloseDate,
          CompetitorInfo, KeyDecisionMakers,
          OpportunityStageId || 1, // Default: Prospecting
          OpportunityStatusId || 1, // Default: Active
          CreatedByUserId
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating opportunity:', error);
      throw error;
    }
  },

  // Find opportunity by ID
  findById: async (opportunityId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          o.*,
          os.StageName as OpportunityStageName,
          ost.StatusName as OpportunityStatusName,
          l.LeadId,
          l.LeadNumber,
          l.CustomerName,
          l.Email,
          l.Phone,
          l.CompanyName,
          l.Industry,
          l.AssignedToUserId,
          u.Name as CreatedByName,
          assignedUser.Name as AssignedToName
         FROM opportunity o
         LEFT JOIN opportunitystage os ON o.OpportunityStageId = os.OpportunityStageId
         LEFT JOIN opportunitystatus ost ON o.OpportunityStatusId = ost.OpportunityStatusId
         LEFT JOIN leads l ON o.LeadId = l.LeadId
         LEFT JOIN users u ON o.CreatedByUserId = u.UserId
         LEFT JOIN users assignedUser ON l.AssignedToUserId = assignedUser.UserId
         WHERE o.OpportunityId = ? AND o.IsDeleted = 0`,
        [opportunityId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding opportunity by ID:', error);
      throw error;
    }
  },

  // Get all opportunities with filters
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        leadId,
        opportunityStageId,
        opportunityStatusId,
        assignedToUserId,
        createdByUserId,
        minValue,
        maxValue,
        search
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          o.OpportunityId,
          o.OpportunityNumber,
          o.OpportunityName,
          o.EstimatedValue,
          o.Currency,
          o.Probability,
          o.ExpectedCloseDate,
          o.ActualCloseDate,
          o.OpportunityStageId,
          o.OpportunityStatusId,
          o.CreatedAt,
          os.StageName as OpportunityStageName,
          ost.StatusName as OpportunityStatusName,
          l.LeadId,
          l.LeadNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          u.Name as CreatedByName
        FROM opportunity o
        LEFT JOIN opportunitystage os ON o.OpportunityStageId = os.OpportunityStageId
        LEFT JOIN opportunitystatus ost ON o.OpportunityStatusId = ost.OpportunityStatusId
        LEFT JOIN leads l ON o.LeadId = l.LeadId
        LEFT JOIN users u ON o.CreatedByUserId = u.UserId
        WHERE o.IsDeleted = 0
      `;

      const params = [];

      if (leadId) {
        query += ' AND o.LeadId = ?';
        params.push(leadId);
      }

      if (opportunityStageId) {
        query += ' AND o.OpportunityStageId = ?';
        params.push(opportunityStageId);
      }

      if (opportunityStatusId) {
        query += ' AND o.OpportunityStatusId = ?';
        params.push(opportunityStatusId);
      }

      if (assignedToUserId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(assignedToUserId);
      }

      if (createdByUserId) {
        query += ' AND o.CreatedByUserId = ?';
        params.push(createdByUserId);
      }

      if (minValue) {
        query += ' AND o.EstimatedValue >= ?';
        params.push(minValue);
      }

      if (maxValue) {
        query += ' AND o.EstimatedValue <= ?';
        params.push(maxValue);
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
      query += ' ORDER BY o.CreatedAt DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        opportunities: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all opportunities:', error);
      throw error;
    }
  },

  // Update opportunity
  update: async (opportunityId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'OpportunityName', 'Description', 'EstimatedValue', 'Currency',
        'Probability', 'ExpectedCloseDate', 'ActualCloseDate',
        'CompetitorInfo', 'KeyDecisionMakers', 'OpportunityStageId',
        'OpportunityStatusId'
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
      params.push(opportunityId);

      const [result] = await pool.query(
        `UPDATE opportunity SET ${fields.join(', ')} WHERE OpportunityId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating opportunity:', error);
      throw error;
    }
  },

  // Update stage
  updateStage: async (opportunityId, stageId) => {
    try {
      const [result] = await pool.query(
        `UPDATE opportunity 
         SET OpportunityStageId = ?, UpdatedAt = NOW() 
         WHERE OpportunityId = ?`,
        [stageId, opportunityId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating opportunity stage:', error);
      throw error;
    }
  },

  // Mark as won
  markAsWon: async (opportunityId) => {
    try {
      const [result] = await pool.query(
        `UPDATE opportunity 
         SET OpportunityStageId = 5, 
             OpportunityStatusId = 2,
             Probability = 100,
             ActualCloseDate = NOW(),
             UpdatedAt = NOW()
         WHERE OpportunityId = ?`,
        [opportunityId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error marking opportunity as won:', error);
      throw error;
    }
  },

  // Mark as lost
  markAsLost: async (opportunityId) => {
    try {
      const [result] = await pool.query(
        `UPDATE opportunity 
         SET OpportunityStageId = 6, 
             OpportunityStatusId = 3,
             Probability = 0,
             ActualCloseDate = NOW(),
             UpdatedAt = NOW()
         WHERE OpportunityId = ?`,
        [opportunityId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error marking opportunity as lost:', error);
      throw error;
    }
  },

  // Delete opportunity (soft delete)
  delete: async (opportunityId) => {
    try {
      const [result] = await pool.query(
        `UPDATE opportunity 
         SET IsDeleted = 1, UpdatedAt = NOW() 
         WHERE OpportunityId = ?`,
        [opportunityId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting opportunity:', error);
      throw error;
    }
  },

  // Get opportunities by lead
  getByLeadId: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          o.*,
          os.StageName as OpportunityStageName,
          ost.StatusName as OpportunityStatusName,
          u.Name as CreatedByName
         FROM opportunity o
         LEFT JOIN opportunitystage os ON o.OpportunityStageId = os.OpportunityStageId
         LEFT JOIN opportunitystatus ost ON o.OpportunityStatusId = ost.OpportunityStatusId
         LEFT JOIN users u ON o.CreatedByUserId = u.UserId
         WHERE o.LeadId = ? AND o.IsDeleted = 0
         ORDER BY o.CreatedAt DESC`,
        [leadId]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting opportunities by lead:', error);
      throw error;
    }
  },

  // Check if lead has active opportunity
  hasActiveOpportunity: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT OpportunityId 
         FROM opportunity 
         WHERE LeadId = ? AND OpportunityStatusId = 1 AND IsDeleted = 0`,
        [leadId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking active opportunity:', error);
      throw error;
    }
  },

  // Get pipeline (opportunities by stage)
  getPipeline: async (userId = null, roleId = null) => {
    try {
      const ROLES = require('../config/constants').ROLES;
      
      let query = `
        SELECT 
          os.OpportunityStageId,
          os.StageName,
          COUNT(o.OpportunityId) as OpportunityCount,
          COALESCE(SUM(o.EstimatedValue), 0) as TotalValue,
          COALESCE(SUM(o.EstimatedValue * o.Probability / 100), 0) as WeightedValue
        FROM opportunitystage os
        LEFT JOIN opportunity o ON os.OpportunityStageId = o.OpportunityStageId 
          AND o.IsDeleted = 0
      `;

      const params = [];

      // Sales Person sees only their opportunities
      if (roleId === ROLES.SALES_PERSON && userId) {
        query += ` LEFT JOIN leads l ON o.LeadId = l.LeadId
                   WHERE l.AssignedToUserId = ?`;
        params.push(userId);
      }

      query += ` GROUP BY os.OpportunityStageId, os.StageName
                 ORDER BY os.OpportunityStageId`;

      const [rows] = await pool.query(query, params);

      return rows;
    } catch (error) {
      logger.error('Error getting pipeline:', error);
      throw error;
    }
  },

  // Get forecast
  getForecast: async (userId = null, roleId = null) => {
    try {
      const ROLES = require('../config/constants').ROLES;
      
      let query = `
        SELECT 
          COUNT(o.OpportunityId) as TotalOpportunities,
          COALESCE(SUM(o.EstimatedValue), 0) as TotalValue,
          COALESCE(SUM(o.EstimatedValue * o.Probability / 100), 0) as WeightedValue,
          COALESCE(AVG(o.Probability), 0) as AverageProbability
        FROM opportunity o
        WHERE o.OpportunityStatusId = 1 AND o.IsDeleted = 0
      `;

      const params = [];

      // Sales Person sees only their forecast
      if (roleId === ROLES.SALES_PERSON && userId) {
        query += ` AND EXISTS (
          SELECT 1 FROM leads l 
          WHERE l.LeadId = o.LeadId 
          AND l.AssignedToUserId = ?
        )`;
        params.push(userId);
      }

      const [rows] = await pool.query(query, params);

      return rows[0];
    } catch (error) {
      logger.error('Error getting forecast:', error);
      throw error;
    }
  },

  // Check if opportunity is closed
  isClosed: async (opportunityId) => {
    try {
      const [rows] = await pool.query(
        `SELECT OpportunityStatusId 
         FROM opportunity 
         WHERE OpportunityId = ? AND IsDeleted = 0`,
        [opportunityId]
      );

      if (rows.length === 0) return false;

      // Status 2 = Won, 3 = Lost
      return rows[0].OpportunityStatusId === 2 || rows[0].OpportunityStatusId === 3;
    } catch (error) {
      logger.error('Error checking if opportunity is closed:', error);
      throw error;
    }
  },

  // Get qualified leads without opportunities (for bulk creation)
  getQualifiedLeadsWithoutOpportunity: async (userId = null, roleId = null) => {
    try {
      const ROLES = require('../config/constants').ROLES;
      
      let query = `
        SELECT 
          l.LeadId,
          l.LeadNumber,
          l.CustomerName,
          l.Email,
          l.Phone,
          l.CompanyName,
          l.Industry,
          l.AssignedToUserId,
          lb.Budget,
          lb.BudgetCurrency,
          lb.Timeline,
          lq.RequirementSummary,
          u.Name as AssignedToName
        FROM leads l
        LEFT JOIN leadbusinessinfo lb ON l.LeadId = lb.LeadId AND lb.IsDeleted = 0
        LEFT JOIN leadqualification lq ON l.LeadId = lq.LeadId AND lq.IsDeleted = 0
        LEFT JOIN users u ON l.AssignedToUserId = u.UserId
        WHERE l.LeadStatusId = 3
        AND l.IsDeleted = 0
        AND NOT EXISTS (
          SELECT 1 FROM opportunity o 
          WHERE o.LeadId = l.LeadId 
          AND o.OpportunityStatusId = 1 
          AND o.IsDeleted = 0
        )
      `;

      const params = [];

      // Sales Person sees only their leads
      if (roleId === ROLES.SALES_PERSON && userId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(userId);
      }

      query += ' ORDER BY l.CreatedAt DESC';

      const [rows] = await pool.query(query, params);

      return rows;
    } catch (error) {
      logger.error('Error getting qualified leads without opportunity:', error);
      throw error;
    }
  }
};

module.exports = OpportunityModel;