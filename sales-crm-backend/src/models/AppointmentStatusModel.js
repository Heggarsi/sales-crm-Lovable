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
  },

  // Create new appointment status
  create: async (statusData) => {
    try {
      const { StatusName, Description } = statusData;
      const [result] = await pool.query(
        'INSERT INTO appointmentstatus (StatusName, Description) VALUES (?, ?)',
        [StatusName, Description]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creating appointment status:', error);
      throw error;
    }
  },

  // Update appointment status
  update: async (statusId, statusData) => {
    try {
      const { StatusName, Description } = statusData;
      const [result] = await pool.query(
        'UPDATE appointmentstatus SET StatusName = ?, Description = ? WHERE AppointmentStatusId = ?',
        [StatusName, Description, statusId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Delete appointment status
  delete: async (statusId) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM appointmentstatus WHERE AppointmentStatusId = ?',
        [statusId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting appointment status:', error);
      throw error;
    }
  }
};

module.exports = AppointmentStatusModel;