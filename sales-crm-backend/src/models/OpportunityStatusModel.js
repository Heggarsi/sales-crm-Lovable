const { pool } = require('../config/database');
const logger = require('../utils/logger');

const OpportunityStatusModel = {
  // Get all opportunity statuses
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM opportunitystatus ORDER BY OpportunityStatusId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting opportunity statuses:', error);
      throw error;
    }
  },

  // Get opportunity status by ID
  findById: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM opportunitystatus WHERE OpportunityStatusId = ?',
        [statusId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding opportunity status by ID:', error);
      throw error;
    }
  }
};

module.exports = OpportunityStatusModel;