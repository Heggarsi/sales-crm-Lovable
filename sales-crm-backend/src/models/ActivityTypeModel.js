const { pool } = require('../config/database');
const logger = require('../utils/logger');

const ActivityTypeModel = {
  // Get all activity types
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM activitytype ORDER BY ActivityTypeId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting activity types:', error);
      throw error;
    }
  },

  // Get activity type by ID
  findById: async (typeId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM activitytype WHERE ActivityTypeId = ?',
        [typeId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding activity type by ID:', error);
      throw error;
    }
  },

  // Get activity type by name
  findByName: async (typeName) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM activitytype WHERE TypeName = ?',
        [typeName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding activity type by name:', error);
      throw error;
    }
  },

  // Create new activity type
  create: async (typeData) => {
    try {
      const { TypeName, Description } = typeData;
      const [result] = await pool.query(
        'INSERT INTO activitytype (TypeName, Description) VALUES (?, ?)',
        [TypeName, Description]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creating activity type:', error);
      throw error;
    }
  },

  // Update activity type
  update: async (typeId, typeData) => {
    try {
      const { TypeName, Description } = typeData;
      const [result] = await pool.query(
        'UPDATE activitytype SET TypeName = ?, Description = ? WHERE ActivityTypeId = ?',
        [TypeName, Description, typeId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating activity type:', error);
      throw error;
    }
  },

  // Delete activity type
  delete: async (typeId) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM activitytype WHERE ActivityTypeId = ?',
        [typeId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting activity type:', error);
      throw error;
    }
  }
};

module.exports = ActivityTypeModel;