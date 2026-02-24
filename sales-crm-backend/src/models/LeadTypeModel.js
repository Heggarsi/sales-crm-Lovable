const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LeadTypeModel = {
  // Get all active lead types
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          LeadTypeId,
          TypeName,
          Description,
          Priority,
          IsActive,
          CreatedAt
         FROM leadtype 
         WHERE IsActive = 1 AND IsDeleted = 0 
         ORDER BY Priority ASC, TypeName ASC`
      );
      return rows;
    } catch (error) {
      logger.error('Error getting lead types:', error);
      throw error;
    }
  },

  // Get lead type by ID
  findById: async (typeId) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM leadtype 
         WHERE LeadTypeId = ? AND IsDeleted = 0`,
        [typeId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead type by ID:', error);
      throw error;
    }
  },

  // Get lead type by name
  findByName: async (typeName) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM leadtype 
         WHERE TypeName = ? AND IsDeleted = 0`,
        [typeName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead type by name:', error);
      throw error;
    }
  },

  // Create new lead type
  create: async (typeData) => {
    try {
      const { TypeName, Description, Priority } = typeData;

      const [result] = await pool.query(
        `INSERT INTO leadtype 
         (TypeName, Description, Priority, IsActive, IsDeleted, CreatedAt, UpdatedAt)
         VALUES (?, ?, ?, 1, 0, NOW(), NOW())`,
        [TypeName, Description, Priority || 99]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating lead type:', error);
      throw error;
    }
  },

  // Update lead type
  update: async (typeId, typeData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = ['TypeName', 'Description', 'Priority', 'IsActive'];

      allowedFields.forEach(field => {
        if (typeData[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(typeData[field]);
        }
      });

      if (fields.length === 0) {
        return false;
      }

      fields.push('UpdatedAt = NOW()');
      params.push(typeId);

      const [result] = await pool.query(
        `UPDATE leadtype SET ${fields.join(', ')} WHERE LeadTypeId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lead type:', error);
      throw error;
    }
  },

  // Delete lead type (soft delete)
  delete: async (typeId) => {
    try {
      const [result] = await pool.query(
        `UPDATE leadtype 
         SET IsDeleted = 1, IsActive = 0, UpdatedAt = NOW() 
         WHERE LeadTypeId = ?`,
        [typeId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting lead type:', error);
      throw error;
    }
  },

  // Check if lead type exists
  exists: async (typeId) => {
    try {
      const [rows] = await pool.query(
        'SELECT LeadTypeId FROM leadtype WHERE LeadTypeId = ? AND IsDeleted = 0',
        [typeId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking lead type existence:', error);
      throw error;
    }
  }
};

module.exports = LeadTypeModel;