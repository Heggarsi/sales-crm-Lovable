const { pool } = require('../config/database');
const logger = require('../utils/logger');

const ProposalStatusModel = {
  // Get all proposal statuses
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM proposalstatus ORDER BY ProposalStatusId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting proposal statuses:', error);
      throw error;
    }
  },

  // Get proposal status by ID
  findById: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM proposalstatus WHERE ProposalStatusId = ?',
        [statusId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding proposal status by ID:', error);
      throw error;
    }
  }
};

module.exports = ProposalStatusModel;