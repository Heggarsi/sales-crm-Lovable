const { pool } = require('../config/database');
const logger = require('../utils/logger');

const AppointmentStatusModel = {
  // Get all appointment statuses
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM appointmentstatus ORDER BY AppointmentStatusId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting appointment statuses:', error);
      throw error;
    }
  },

  // Get appointment status by ID
  findById: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM appointmentstatus WHERE AppointmentStatusId = ?',
        [statusId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding appointment status by ID:', error);
      throw error;
    }
  },

  // Get appointment status by name
  findByName: async (statusName) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM appointmentstatus WHERE StatusName = ?',
        [statusName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding appointment status by name:', error);
      throw error;
    }
  }
};

module.exports = AppointmentStatusModel;