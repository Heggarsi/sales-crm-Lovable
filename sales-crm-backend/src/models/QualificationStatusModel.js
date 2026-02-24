const { pool } = require('../config/database');
const logger = require('../utils/logger');

const QualificationStatusModel = {
  // Get all qualification statuses
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM qualificationstatus ORDER BY QualificationStatusId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting qualification statuses:', error);
      throw error;
    }
  },

  // Get qualification status by ID
  findById: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM qualificationstatus WHERE QualificationStatusId = ?',
        [statusId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding qualification status by ID:', error);
      throw error;
    }
  },

  // Get qualification status by name
  findByName: async (statusName) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM qualificationstatus WHERE StatusName = ?',
        [statusName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding qualification status by name:', error);
      throw error;
    }
  },

  // Create new qualification status (Admin only operation)
  create: async (statusData) => {
    try {
      const { StatusName } = statusData;

      const [result] = await pool.query(
        'INSERT INTO qualificationstatus (StatusName) VALUES (?)',
        [StatusName]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating qualification status:', error);
      throw error;
    }
  },

  // Update qualification status (Admin only operation)
  update: async (statusId, statusData) => {
    try {
      const { StatusName } = statusData;

      const [result] = await pool.query(
        'UPDATE qualificationstatus SET StatusName = ? WHERE QualificationStatusId = ?',
        [StatusName, statusId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating qualification status:', error);
      throw error;
    }
  },

  // Delete qualification status (Admin only operation - soft delete if applicable)
  delete: async (statusId) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM qualificationstatus WHERE QualificationStatusId = ?',
        [statusId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting qualification status:', error);
      throw error;
    }
  },

  // Check if qualification status exists
  exists: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT QualificationStatusId FROM qualificationstatus WHERE QualificationStatusId = ?',
        [statusId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking qualification status existence:', error);
      throw error;
    }
  }
};

module.exports = QualificationStatusModel;