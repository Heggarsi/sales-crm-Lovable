const { pool } = require('../config/database');
const logger = require('../utils/logger');

const DeliveryStatusModel = {
  // Get all delivery statuses
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM deliverystatus ORDER BY DeliveryStatusId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting delivery statuses:', error);
      throw error;
    }
  },

  // Get delivery status by ID
  findById: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM deliverystatus WHERE DeliveryStatusId = ?',
        [statusId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding delivery status by ID:', error);
      throw error;
    }
  },

  // Create new delivery status
  create: async (statusData) => {
    try {
      const { StatusName, Description } = statusData;
      const [result] = await pool.query(
        'INSERT INTO deliverystatus (StatusName, Description) VALUES (?, ?)',
        [StatusName, Description]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creating delivery status:', error);
      throw error;
    }
  },

  // Update delivery status
  update: async (statusId, statusData) => {
    try {
      const { StatusName, Description } = statusData;
      const [result] = await pool.query(
        'UPDATE deliverystatus SET StatusName = ?, Description = ? WHERE DeliveryStatusId = ?',
        [StatusName, Description, statusId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating delivery status:', error);
      throw error;
    }
  },

  // Delete delivery status
  delete: async (statusId) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM deliverystatus WHERE DeliveryStatusId = ?',
        [statusId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting delivery status:', error);
      throw error;
    }
  }
};

module.exports = DeliveryStatusModel;
