const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LeadFollowupModel = {
  // Create new follow-up
  create: async (followUpData) => {
    try {
      const {
        LeadId,
        FollowUpDate,
        FollowUpTypeId,
        Remarks,
        NextFollowUpDate,
        CreatedByUserId
      } = followUpData;

      const [result] = await pool.query(
        `INSERT INTO leadfollowup 
         (LeadId, FollowUpDate, FollowUpTypeId, Remarks, NextFollowUpDate, IsDeleted, CreatedByUserId, CreatedAt, UpdatedAt)
         VALUES (?, ?, ?, ?, ?, 0, ?, NOW(), NOW())`,
        [LeadId, FollowUpDate, FollowUpTypeId, Remarks || null, NextFollowUpDate || null, CreatedByUserId || null]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating follow-up:', error);
      throw error;
    }
  },

  // Get follow-up by ID
  findById: async (followUpId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          f.*,
          ft.TypeName as FollowUpTypeName,
          u.Name as CreatedByName
         FROM leadfollowup f
         LEFT JOIN lead_followup_type ft ON f.FollowUpTypeId = ft.FollowUpTypeId
         LEFT JOIN users u ON f.CreatedByUserId = u.UserId
         WHERE f.FollowUpId = ? AND f.IsDeleted = 0`,
        [followUpId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding follow-up by ID:', error);
      throw error;
    }
  },

  // Get all follow-ups for a lead
  getByLeadId: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          f.FollowUpId,
          f.LeadId,
          f.FollowUpDate,
          f.FollowUpTypeId,
          ft.TypeName as FollowUpTypeName,
          f.Remarks,
          f.NextFollowUpDate,
          f.CreatedByUserId,
          u.Name as CreatedByName,
          f.CreatedAt
         FROM leadfollowup f
         LEFT JOIN lead_followup_type ft ON f.FollowUpTypeId = ft.FollowUpTypeId
         LEFT JOIN users u ON f.CreatedByUserId = u.UserId
         WHERE f.LeadId = ? AND f.IsDeleted = 0
         ORDER BY f.FollowUpDate DESC`,
        [leadId]
      );
      return rows;
    } catch (error) {
      logger.error('Error getting follow-ups by lead:', error);
      throw error;
    }
  },

  // Update follow-up
  update: async (followUpId, followUpData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = ['FollowUpDate', 'FollowUpTypeId', 'Remarks', 'NextFollowUpDate'];

      allowedFields.forEach(field => {
        if (followUpData[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(followUpData[field]);
        }
      });

      if (fields.length === 0) {
        return false;
      }

      fields.push('UpdatedAt = NOW()');
      params.push(followUpId);

      const [result] = await pool.query(
        `UPDATE leadfollowup SET ${fields.join(', ')} WHERE FollowUpId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating follow-up:', error);
      throw error;
    }
  },

  // Delete follow-up (soft delete)
  delete: async (followUpId) => {
    try {
      const [result] = await pool.query(
        `UPDATE leadfollowup 
         SET IsDeleted = 1, UpdatedAt = NOW() 
         WHERE FollowUpId = ?`,
        [followUpId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting follow-up:', error);
      throw error;
    }
  },

  // Check if follow-up exists and belongs to lead
  exists: async (followUpId, leadId) => {
    try {
      const [rows] = await pool.query(
        'SELECT FollowUpId FROM leadfollowup WHERE FollowUpId = ? AND LeadId = ? AND IsDeleted = 0',
        [followUpId, leadId]
      );

      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking follow-up existence:', error);
      throw error;
    }
  }
};

module.exports = LeadFollowupModel;