const { pool } = require('../config/database');
const logger = require('../utils/logger');

const ActivityLogModel = {
  // Create activity log
  create: async (activityData) => {
    try {
      const {
        LeadId,
        ActivityTypeId,
        Subject,
        Description,
        Direction,
        Duration,
        Outcome,
        ActivityDate,
        ScheduledFollowUp,
        CreatedByUserId,
        Attachments
      } = activityData;

      const [result] = await pool.query(
        `INSERT INTO activitylog (
          LeadId, ActivityTypeId, Subject, Description, Direction, Duration,
          Outcome, ActivityDate, ScheduledFollowUp, CreatedByUserId,
          Attachments, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          LeadId, ActivityTypeId, Subject, Description, Direction, Duration,
          Outcome, ActivityDate || helpers.formatDateTimeForMySQL(),
          ScheduledFollowUp || null, CreatedByUserId,
          typeof Attachments === 'object' ? JSON.stringify(Attachments) : Attachments
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating activity log:', error);
      throw error;
    }
  },

  // Find activity by ID
  findById: async (activityId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          al.*,
          at.TypeName as ActivityTypeName,
          l.LeadNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          u.Name as CreatedByName
         FROM activitylog al
         LEFT JOIN activitytype at ON al.ActivityTypeId = at.ActivityTypeId
         LEFT JOIN leads l ON al.LeadId = l.LeadId
         LEFT JOIN users u ON al.CreatedByUserId = u.UserId
         WHERE al.ActivityId = ? AND al.IsDeleted = 0`,
        [activityId]
      );

      if (rows.length > 0 && rows[0].Attachments) {
        try {
          rows[0].Attachments = JSON.parse(rows[0].Attachments);
        } catch (e) {}
      }

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding activity by ID:', error);
      throw error;
    }
  },

  // Get all activities with filters
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        leadId,
        activityTypeId,
        createdByUserId,
        assignedToUserId,
        fromDate,
        toDate,
        search
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          al.ActivityId,
          al.Subject,
          al.Description,
          al.Direction,
          al.Duration,
          al.Outcome,
          al.ActivityDate,
          al.ScheduledFollowUp,
          al.CreatedAt,
          at.TypeName as ActivityTypeName,
          l.LeadId,
          l.LeadNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          u.Name as CreatedByName
        FROM activitylog al
        LEFT JOIN activitytype at ON al.ActivityTypeId = at.ActivityTypeId
        LEFT JOIN leads l ON al.LeadId = l.LeadId
        LEFT JOIN users u ON al.CreatedByUserId = u.UserId
        WHERE al.IsDeleted = 0
      `;

      const params = [];

      if (leadId) {
        query += ' AND al.LeadId = ?';
        params.push(leadId);
      }

      if (activityTypeId) {
        query += ' AND al.ActivityTypeId = ?';
        params.push(activityTypeId);
      }

      if (createdByUserId) {
        query += ' AND al.CreatedByUserId = ?';
        params.push(createdByUserId);
      }

      if (assignedToUserId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(assignedToUserId);
      }

      if (fromDate) {
        query += ' AND al.ActivityDate >= ?';
        params.push(fromDate);
      }

      if (toDate) {
        query += ' AND al.ActivityDate <= ?';
        params.push(toDate);
      }

      if (search) {
        query += ' AND (al.Subject LIKE ? OR al.Description LIKE ? OR l.CustomerName LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const countQuery = query.replace(
        /SELECT[\s\S]*FROM/,
        'SELECT COUNT(*) as total FROM'
      );

      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      query += ' ORDER BY al.ActivityDate DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        activities: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all activities:', error);
      throw error;
    }
  },

  // Update activity
  update: async (activityId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'ActivityTypeId', 'Subject', 'Description', 'Direction',
        'Duration', 'Outcome', 'ActivityDate', 'ScheduledFollowUp', 'Attachments'
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
      params.push(activityId);

      const [result] = await pool.query(
        `UPDATE activitylog SET ${fields.join(', ')} WHERE ActivityId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating activity:', error);
      throw error;
    }
  },

  // Delete activity (soft delete)
  delete: async (activityId) => {
    try {
      const [result] = await pool.query(
        `UPDATE activitylog 
         SET IsDeleted = 1, UpdatedAt = NOW() 
         WHERE ActivityId = ?`,
        [activityId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting activity:', error);
      throw error;
    }
  },

  // Get activities by lead
  getByLeadId: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          al.*,
          at.TypeName as ActivityTypeName,
          u.Name as CreatedByName
         FROM activitylog al
         LEFT JOIN activitytype at ON al.ActivityTypeId = at.ActivityTypeId
         LEFT JOIN users u ON al.CreatedByUserId = u.UserId
         WHERE al.LeadId = ? AND al.IsDeleted = 0
         ORDER BY al.ActivityDate DESC`,
        [leadId]
      );

      rows.forEach(row => {
        if (row.Attachments) {
          try {
            row.Attachments = JSON.parse(row.Attachments);
          } catch (e) {}
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting activities by lead:', error);
      throw error;
    }
  },

  // Get upcoming follow-ups
  getUpcomingFollowUps: async (userId, days = 7) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          al.*, 
          at.TypeName as ActivityTypeName, 
          l.LeadNumber, 
          l.CustomerName, 
          l.CompanyName 
         FROM activitylog al 
         LEFT JOIN activitytype at ON al.ActivityTypeId = at.ActivityTypeId 
         LEFT JOIN leads l ON al.LeadId = l.LeadId 
         WHERE al.ScheduledFollowUp IS NOT NULL 
         AND al.ScheduledFollowUp >= CURDATE() 
         AND al.ScheduledFollowUp <= DATE_ADD(CURDATE(), INTERVAL ? DAY) 
         AND al.CreatedByUserId = ? 
         AND al.IsDeleted = 0 
         ORDER BY al.ScheduledFollowUp ASC`,
        [days, userId]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting upcoming follow-ups:', error);
      throw error;
    }
  }
};

module.exports = ActivityLogModel;
