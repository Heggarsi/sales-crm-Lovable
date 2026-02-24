const { pool } = require('../config/database');
const logger = require('../utils/logger');

const UserRoleModel = {
  // Get all roles
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM userrole WHERE IsActive = 1 ORDER BY RoleId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting all roles:', error);
      throw error;
    }
  },

  // Get role by ID
  findById: async (roleId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM userrole WHERE RoleId = ? AND IsActive = 1',
        [roleId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding role by ID:', error);
      throw error;
    }
  },

  // Get role by name
  findByName: async (roleName) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM userrole WHERE RoleName = ? AND IsActive = 1',
        [roleName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding role by name:', error);
      throw error;
    }
  }
};

module.exports = UserRoleModel;