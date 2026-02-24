const { pool } = require('../config/database');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const MinutesOfMeetingModel = {
  // Create MOM
  create: async (momData) => {
    try {
      const {
        AppointmentId,
        LeadId,
        MeetingDate,
        Attendees,
        DiscussionPoints,
        Decisions,
        ActionItems,
        NextSteps,
        FollowUpDate,
        ClientFeedback,
        InternalNotes,
        Status,
        PreparedByUserId,
        ReviewedByUserId,
        SharedWithClient,
        Attachments
      } = momData;

      const MOMNumber = helpers.generateUniqueNumber('MOM');

      const [result] = await pool.query(
        `INSERT INTO minutesofmeeting (
          MOMNumber, AppointmentId, LeadId, MeetingDate, Attendees,
          DiscussionPoints, Decisions, ActionItems, NextSteps, FollowUpDate,
          ClientFeedback, InternalNotes, Status, PreparedByUserId,
          ReviewedByUserId, SharedWithClient, Attachments, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          MOMNumber, AppointmentId, LeadId, MeetingDate, Attendees,
          DiscussionPoints, Decisions, ActionItems, NextSteps, FollowUpDate,
          ClientFeedback, InternalNotes, Status || 'Draft', PreparedByUserId,
          ReviewedByUserId || null, SharedWithClient || 0,
          typeof Attachments === 'object' ? JSON.stringify(Attachments) : Attachments
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating MOM:', error);
      throw error;
    }
  },

  // Find MOM by ID
  findById: async (momId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          m.*,
          l.LeadNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          a.AppointmentNumber,
          a.Title as AppointmentTitle,
          u1.Name as PreparedByName,
          u2.Name as ReviewedByName
         FROM minutesofmeeting m
         LEFT JOIN leads l ON m.LeadId = l.LeadId
         LEFT JOIN appointment a ON m.AppointmentId = a.AppointmentId
         LEFT JOIN users u1 ON m.PreparedByUserId = u1.UserId
         LEFT JOIN users u2 ON m.ReviewedByUserId = u2.UserId
         WHERE m.MOMId = ? AND m.IsDeleted = 0`,
        [momId]
      );

      if (rows.length > 0 && rows[0].Attachments) {
        try {
          rows[0].Attachments = JSON.parse(rows[0].Attachments);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding MOM by ID:', error);
      throw error;
    }
  },

  // Get all MOMs with filters
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        leadId,
        appointmentId,
        preparedByUserId,
        assignedToUserId,
        status,
        sharedWithClient,
        search
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          m.MOMId,
          m.MOMNumber,
          m.MeetingDate,
          m.Status,
          m.SharedWithClient,
          m.CreatedAt,
          l.LeadNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          a.AppointmentNumber,
          a.Title as AppointmentTitle,
          u.Name as PreparedByName
        FROM minutesofmeeting m
        LEFT JOIN leads l ON m.LeadId = l.LeadId
        LEFT JOIN appointment a ON m.AppointmentId = a.AppointmentId
        LEFT JOIN users u ON m.PreparedByUserId = u.UserId
        WHERE m.IsDeleted = 0
      `;

      const params = [];

      if (leadId) {
        query += ' AND m.LeadId = ?';
        params.push(leadId);
      }

      if (appointmentId) {
        query += ' AND m.AppointmentId = ?';
        params.push(appointmentId);
      }

      if (preparedByUserId) {
        query += ' AND m.PreparedByUserId = ?';
        params.push(preparedByUserId);
      }

      if (assignedToUserId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(assignedToUserId);
      }

      if (status) {
        query += ' AND m.Status = ?';
        params.push(status);
      }

      if (sharedWithClient !== undefined) {
        query += ' AND m.SharedWithClient = ?';
        params.push(sharedWithClient);
      }

      if (search) {
        query += ' AND (l.CustomerName LIKE ? OR l.CompanyName LIKE ? OR a.Title LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const countQuery = query.replace(
        /SELECT[\s\S]*FROM/,
        'SELECT COUNT(*) as total FROM'
      );
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated results
      query += ' ORDER BY m.MeetingDate DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        moms: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all MOMs:', error);
      throw error;
    }
  },

  // Update MOM
  update: async (momId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'MeetingDate', 'Attendees', 'DiscussionPoints', 'Decisions',
        'ActionItems', 'NextSteps', 'FollowUpDate', 'ClientFeedback',
        'InternalNotes', 'Status', 'ReviewedByUserId', 'SharedWithClient',
        'Attachments'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'Attachments' && typeof updateData[field] === 'object') {
            fields.push(`${field} = ?`);
            params.push(JSON.stringify(updateData[field]));
          } else {
            fields.push(`${field} = ?`);
            params.push(updateData[field]);
          }
        }
      });

      if (fields.length === 0) {
        return false;
      }

      fields.push('UpdatedAt = NOW()');
      params.push(momId);

      const [result] = await pool.query(
        `UPDATE minutesofmeeting SET ${fields.join(', ')} WHERE MOMId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating MOM:', error);
      throw error;
    }
  },

  // Mark MOM as shared with client
  markAsShared: async (momId) => {
    try {
      const [result] = await pool.query(
        `UPDATE minutesofmeeting 
         SET SharedWithClient = 1, SharedAt = NOW(), UpdatedAt = NOW() 
         WHERE MOMId = ?`,
        [momId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error marking MOM as shared:', error);
      throw error;
    }
  },

  // Delete MOM (soft delete)
  delete: async (momId) => {
    try {
      const [result] = await pool.query(
        `UPDATE minutesofmeeting 
         SET IsDeleted = 1, UpdatedAt = NOW() 
         WHERE MOMId = ?`,
        [momId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting MOM:', error);
      throw error;
    }
  },

  // Get MOM by appointment
  findByAppointmentId: async (appointmentId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          m.*,
          l.LeadNumber,
          l.CustomerName,
          l.AssignedToUserId,
          u1.Name as PreparedByName,
          u2.Name as ReviewedByName
         FROM minutesofmeeting m
         LEFT JOIN leads l ON m.LeadId = l.LeadId
         LEFT JOIN users u1 ON m.PreparedByUserId = u1.UserId
         LEFT JOIN users u2 ON m.ReviewedByUserId = u2.UserId
         WHERE m.AppointmentId = ? AND m.IsDeleted = 0
         ORDER BY m.CreatedAt DESC
         LIMIT 1`,
        [appointmentId]
      );

      if (rows.length > 0 && rows[0].Attachments) {
        try {
          rows[0].Attachments = JSON.parse(rows[0].Attachments);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding MOM by appointment:', error);
      throw error;
    }
  },

  // Get MOMs by lead
  getByLeadId: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          m.*,
          a.AppointmentNumber,
          a.Title as AppointmentTitle,
          u1.Name as PreparedByName,
          u2.Name as ReviewedByName
         FROM minutesofmeeting m
         LEFT JOIN appointment a ON m.AppointmentId = a.AppointmentId
         LEFT JOIN users u1 ON m.PreparedByUserId = u1.UserId
         LEFT JOIN users u2 ON m.ReviewedByUserId = u2.UserId
         WHERE m.LeadId = ? AND m.IsDeleted = 0
         ORDER BY m.MeetingDate DESC`,
        [leadId]
      );

      rows.forEach(row => {
        if (row.Attachments) {
          try {
            row.Attachments = JSON.parse(row.Attachments);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting MOMs by lead:', error);
      throw error;
    }
  }
};

module.exports = MinutesOfMeetingModel;