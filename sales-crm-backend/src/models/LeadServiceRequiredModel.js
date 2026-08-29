const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LeadServiceRequiredModel = {
  // Get all active lead services
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          ServiceRequiredId,
          ServiceName,
          Description,
          IsActive,
          CreatedAt
         FROM lead_service_required 
         WHERE IsActive = 1 AND IsDeleted = 0 
         ORDER BY ServiceName`
      );
      return rows;
    } catch (error) {
      logger.error('Error getting lead services:', error);
      throw error;
    }
  },

  // Get lead service by ID
  findById: async (serviceId) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM lead_service_required 
         WHERE ServiceRequiredId = ? AND IsDeleted = 0`,
        [serviceId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead service by ID:', error);
      throw error;
    }
  },

  // Get lead service by name
  findByName: async (serviceName) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM lead_service_required 
         WHERE ServiceName = ? AND IsDeleted = 0`,
        [serviceName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead service by name:', error);
      throw error;
    }
  },

  // Create new lead service
  create: async (serviceData) => {
    try {
      const { ServiceName, Description } = serviceData;

      const [result] = await pool.query(
        `INSERT INTO lead_service_required 
         (ServiceName, Description, IsActive, IsDeleted, CreatedAt, UpdatedAt)
         VALUES (?, ?, 1, 0, NOW(), NOW())`,
        [ServiceName, Description]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating lead service:', error);
      throw error;
    }
  },

  // Update lead service
  update: async (serviceId, serviceData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = ['ServiceName', 'Description', 'IsActive'];

      allowedFields.forEach(field => {
        if (serviceData[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(serviceData[field]);
        }
      });

      if (fields.length === 0) {
        return false;
      }

      fields.push('UpdatedAt = NOW()');
      params.push(serviceId);

      const [result] = await pool.query(
        `UPDATE lead_service_required SET ${fields.join(', ')} WHERE ServiceRequiredId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lead service:', error);
      throw error;
    }
  },

  // Delete lead service (soft delete)
  delete: async (serviceId) => {
    try {
      const [result] = await pool.query(
        `UPDATE lead_service_required 
         SET IsDeleted = 1, IsActive = 0, UpdatedAt = NOW() 
         WHERE ServiceRequiredId = ?`,
        [serviceId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting lead service:', error);
      throw error;
    }
  },

  // Check if lead service exists
  exists: async (serviceId) => {
    try {
      const [rows] = await pool.query(
        'SELECT ServiceRequiredId FROM lead_service_required WHERE ServiceRequiredId = ? AND IsDeleted = 0',
        [serviceId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking lead service existence:', error);
      throw error;
    }
  }
};

module.exports = LeadServiceRequiredModel;