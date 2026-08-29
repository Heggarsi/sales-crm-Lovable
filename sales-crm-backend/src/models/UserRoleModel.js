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
  },

  // Create new role
  create: async (roleData) => {
    try {
      const { RoleName, Description } = roleData;
      const [result] = await pool.query(
        'INSERT INTO userrole (RoleName, Description, IsActive) VALUES (?, ?, 1)',
        [RoleName, Description || null]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  },

  // Update role
  update: async (roleId, roleData) => {
    try {
      const fields = [];
      const params = [];
      const allowedFields = ['RoleName', 'Description', 'IsActive'];

      allowedFields.forEach(field => {
        if (roleData[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(roleData[field]);
        }
      });

      if (fields.length === 0) return false;

      params.push(roleId);
      const [result] = await pool.query(
        `UPDATE userrole SET ${fields.join(', ')} WHERE RoleId = ?`,
        params
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  },

  // Delete role (soft delete)
  delete: async (roleId) => {
    try {
      const [result] = await pool.query(
        'UPDATE userrole SET IsActive = 0 WHERE RoleId = ?',
        [roleId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }
};

module.exports = UserRoleModel;