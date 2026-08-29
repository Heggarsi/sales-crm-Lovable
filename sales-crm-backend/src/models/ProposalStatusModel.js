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
  },

  // Create new proposal status
  create: async (statusData) => {
    try {
      const { StatusName } = statusData;
      const [result] = await pool.query(
        'INSERT INTO proposalstatus (StatusName) VALUES (?)',
        [StatusName]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creating proposal status:', error);
      throw error;
    }
  },

  // Update proposal status
  update: async (statusId, statusData) => {
    try {
      const { StatusName } = statusData;
      const [result] = await pool.query(
        'UPDATE proposalstatus SET StatusName = ? WHERE ProposalStatusId = ?',
        [StatusName, statusId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating proposal status:', error);
      throw error;
    }
  },

  // Delete proposal status
  delete: async (statusId) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM proposalstatus WHERE ProposalStatusId = ?',
        [statusId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting proposal status:', error);
      throw error;
    }
  }
};

module.exports = ProposalStatusModel;