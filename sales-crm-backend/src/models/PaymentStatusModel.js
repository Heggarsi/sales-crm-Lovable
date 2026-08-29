const { pool } = require('../config/database');
const logger = require('../utils/logger');

const PaymentStatusModel = {
  // Get all payment statuses
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM paymentstatus ORDER BY PaymentStatusId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting payment statuses:', error);
      throw error;
    }
  },

  // Get payment status by ID
  findById: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM paymentstatus WHERE PaymentStatusId = ?',
        [statusId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding payment status by ID:', error);
      throw error;
    }
  },

  // Create new payment status
  create: async (statusData) => {
    try {
      const { StatusName, Description } = statusData;
      const [result] = await pool.query(
        'INSERT INTO paymentstatus (StatusName, Description) VALUES (?, ?)',
        [StatusName, Description]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creating payment status:', error);
      throw error;
    }
  },

  // Update payment status
  update: async (statusId, statusData) => {
    try {
      const { StatusName, Description } = statusData;
      const [result] = await pool.query(
        'UPDATE paymentstatus SET StatusName = ?, Description = ? WHERE PaymentStatusId = ?',
        [StatusName, Description, statusId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Delete payment status
  delete: async (statusId) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM paymentstatus WHERE PaymentStatusId = ?',
        [statusId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting payment status:', error);
      throw error;
    }
  }
};

module.exports = PaymentStatusModel;
