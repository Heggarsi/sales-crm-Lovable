const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LeadStatusModel = {
  // Get all lead statuses
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          LeadStatusId,
          StatusName,
          Description
         FROM leadstatus 
         ORDER BY LeadStatusId`
      );
      return rows;
    } catch (error) {
      logger.error('Error getting lead statuses:', error);
      throw error;
    }
  },

  // Get lead status by ID
  findById: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM leadstatus WHERE LeadStatusId = ?',
        [statusId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead status by ID:', error);
      throw error;
    }
  },

  // Get lead status by name
  findByName: async (statusName) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM leadstatus WHERE StatusName = ?',
        [statusName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead status by name:', error);
      throw error;
    }
  },

  // Create new lead status
  create: async (statusData) => {
    try {
      const { StatusName, Description } = statusData;

      const [result] = await pool.query(
        'INSERT INTO leadstatus (StatusName, Description) VALUES (?, ?)',
        [StatusName, Description]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating lead status:', error);
      throw error;
    }
  },

  // Update lead status
  update: async (statusId, statusData) => {
    try {
      const { StatusName, Description } = statusData;
      
      const fields = [];
      const params = [];

      if (StatusName !== undefined) {
        fields.push('StatusName = ?');
        params.push(StatusName);
      }

      if (Description !== undefined) {
        fields.push('Description = ?');
        params.push(Description);
      }

      if (fields.length === 0) {
        return false;
      }

      params.push(statusId);

      const [result] = await pool.query(
        `UPDATE leadstatus SET ${fields.join(', ')} WHERE LeadStatusId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lead status:', error);
      throw error;
    }
  },

  // Delete lead status
  delete: async (statusId) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM leadstatus WHERE LeadStatusId = ?',
        [statusId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting lead status:', error);
      throw error;
    }
  },

  // Check if lead status exists
  exists: async (statusId) => {
    try {
      const [rows] = await pool.query(
        'SELECT LeadStatusId FROM leadstatus WHERE LeadStatusId = ?',
        [statusId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking lead status existence:', error);
      throw error;
    }
  }
};

module.exports = LeadStatusModel;