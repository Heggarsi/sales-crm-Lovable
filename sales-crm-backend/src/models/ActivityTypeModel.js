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
  }
};

module.exports = ActivityTypeModel;