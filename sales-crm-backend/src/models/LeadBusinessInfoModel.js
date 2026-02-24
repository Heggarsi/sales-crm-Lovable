const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LeadBusinessInfoModel = {
  // Create business info
  create: async (businessInfoData) => {
    try {
      const {
        LeadId,
        Budget,
        BudgetCurrency,
        BudgetRange,
        Timeline,
        Authority,
        NeedSummary,
        Competition,
        CurrentSolution,
        KeyStakeholders,
        CapturedByUserId
      } = businessInfoData;

      const [result] = await pool.query(
        `INSERT INTO leadbusinessinfo (
          LeadId, Budget, BudgetCurrency, BudgetRange, Timeline, Authority,
          NeedSummary, Competition, CurrentSolution, KeyStakeholders,
          CapturedByUserId, CapturedAt, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, NOW(), NOW())`,
        [
          LeadId, Budget, BudgetCurrency, BudgetRange, Timeline, Authority,
          NeedSummary, Competition, CurrentSolution, KeyStakeholders,
          CapturedByUserId
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating lead business info:', error);
      throw error;
    }
  },

  // Find by lead ID
  findByLeadId: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          lbi.*,
          u.Name as CapturedByUserName
         FROM leadbusinessinfo lbi
         LEFT JOIN users u ON lbi.CapturedByUserId = u.UserId
         WHERE lbi.LeadId = ? AND lbi.IsDeleted = 0
         ORDER BY lbi.CapturedAt DESC
         LIMIT 1`,
        [leadId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead business info:', error);
      throw error;
    }
  },

  // Update business info
  update: async (businessInfoId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'Budget', 'BudgetCurrency', 'BudgetRange', 'Timeline', 'Authority',
        'NeedSummary', 'Competition', 'CurrentSolution', 'KeyStakeholders'
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
      params.push(businessInfoId);

      const [result] = await pool.query(
        `UPDATE leadbusinessinfo SET ${fields.join(', ')} WHERE BusinessInfoId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lead business info:', error);
      throw error;
    }
  },

  // Delete business info (soft delete)
  delete: async (businessInfoId) => {
    try {
      const [result] = await pool.query(
        'UPDATE leadbusinessinfo SET IsDeleted = 1, UpdatedAt = NOW() WHERE BusinessInfoId = ?',
        [businessInfoId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting lead business info:', error);
      throw error;
    }
  }
};

module.exports = LeadBusinessInfoModel;