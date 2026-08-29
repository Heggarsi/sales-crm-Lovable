const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LeadFollowUpTypeModel = {
  // Get all active follow-up types
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          FollowUpTypeId,
          TypeName,
          Description,
          IsActive,
          CreatedAt
         FROM lead_followup_type 
         WHERE IsActive = 1 AND IsDeleted = 0 
         ORDER BY TypeName`
      );
      return rows;
    } catch (error) {
      logger.error('Error getting lead follow-up types:', error);
      throw error;
    }
  },

  // Get follow-up type by ID
  findById: async (typeId) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM lead_followup_type 
         WHERE FollowUpTypeId = ? AND IsDeleted = 0`,
        [typeId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding follow-up type by ID:', error);
      throw error;
    }
  },

  // Get follow-up type by name
  findByName: async (typeName) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM lead_followup_type 
         WHERE TypeName = ? AND IsDeleted = 0`,
        [typeName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding follow-up type by name:', error);
      throw error;
    }
  },

  // Create new follow-up type
  create: async (typeData) => {
    try {
      const { TypeName, Description } = typeData;

      const [result] = await pool.query(
        `INSERT INTO lead_followup_type 
         (TypeName, Description, IsActive, IsDeleted, CreatedAt, UpdatedAt)
         VALUES (?, ?, 1, 0, NOW(), NOW())`,
        [TypeName, Description]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating follow-up type:', error);
      throw error;
    }
  },

  // Update follow-up type
  update: async (typeId, typeData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = ['TypeName', 'Description', 'IsActive'];

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
        `UPDATE lead_followup_type SET ${fields.join(', ')} WHERE FollowUpTypeId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating follow-up type:', error);
      throw error;
    }
  },

  // Delete follow-up type (soft delete)
  delete: async (typeId) => {
    try {
      const [result] = await pool.query(
        `UPDATE lead_followup_type 
         SET IsDeleted = 1, IsActive = 0, UpdatedAt = NOW() 
         WHERE FollowUpTypeId = ?`,
        [typeId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting follow-up type:', error);
      throw error;
    }
  },

  // Check if follow-up type exists
  exists: async (typeId) => {
    try {
      const [rows] = await pool.query(
        'SELECT FollowUpTypeId FROM lead_followup_type WHERE FollowUpTypeId = ? AND IsDeleted = 0',
        [typeId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking follow-up type existence:', error);
      throw error;
    }
  }
};

module.exports = LeadFollowUpTypeModel;