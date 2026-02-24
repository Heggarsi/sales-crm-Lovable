const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LeadSourceModel = {
  // Get all active lead sources
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          SourceId,
          SourceName,
          SourceType,
          Description,
          IsActive,
          CreatedAt
         FROM leadsource 
         WHERE IsActive = 1 AND IsDeleted = 0 
         ORDER BY SourceName`
      );
      return rows;
    } catch (error) {
      logger.error('Error getting lead sources:', error);
      throw error;
    }
  },

  // Get lead source by ID
  findById: async (sourceId) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM leadsource 
         WHERE SourceId = ? AND IsDeleted = 0`,
        [sourceId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead source by ID:', error);
      throw error;
    }
  },

  // Get lead source by name
  findByName: async (sourceName) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM leadsource 
         WHERE SourceName = ? AND IsDeleted = 0`,
        [sourceName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead source by name:', error);
      throw error;
    }
  },

  // Create new lead source
  create: async (sourceData) => {
    try {
      const { SourceName, SourceType, Description } = sourceData;

      const [result] = await pool.query(
        `INSERT INTO leadsource 
         (SourceName, SourceType, Description, IsActive, IsDeleted, CreatedAt, UpdatedAt)
         VALUES (?, ?, ?, 1, 0, NOW(), NOW())`,
        [SourceName, SourceType, Description]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating lead source:', error);
      throw error;
    }
  },

  // Update lead source
  update: async (sourceId, sourceData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = ['SourceName', 'SourceType', 'Description', 'IsActive'];

      allowedFields.forEach(field => {
        if (sourceData[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(sourceData[field]);
        }
      });

      if (fields.length === 0) {
        return false;
      }

      fields.push('UpdatedAt = NOW()');
      params.push(sourceId);

      const [result] = await pool.query(
        `UPDATE leadsource SET ${fields.join(', ')} WHERE SourceId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lead source:', error);
      throw error;
    }
  },

  // Delete lead source (soft delete)
  delete: async (sourceId) => {
    try {
      const [result] = await pool.query(
        `UPDATE leadsource 
         SET IsDeleted = 1, IsActive = 0, UpdatedAt = NOW() 
         WHERE SourceId = ?`,
        [sourceId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting lead source:', error);
      throw error;
    }
  },

  // Check if lead source exists
  exists: async (sourceId) => {
    try {
      const [rows] = await pool.query(
        'SELECT SourceId FROM leadsource WHERE SourceId = ? AND IsDeleted = 0',
        [sourceId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking lead source existence:', error);
      throw error;
    }
  }
};

module.exports = LeadSourceModel;