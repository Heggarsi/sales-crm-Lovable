const { pool } = require('../config/database');
const logger = require('../utils/logger');

const ActivityLogModel = {
  // Create activity log
  create: async (activityData) => {
    try {
      const {
        AppointmentId,
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
          AppointmentId, ActivityTypeId, Subject, Description, Direction, Duration,
          Outcome, ActivityDate, ScheduledFollowUp, CreatedByUserId,
          Attachments, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          AppointmentId, ActivityTypeId, Subject, Description, Direction, Duration,
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
          ap.AppointmentNumber,
          ap.Title as AppointmentTitle,
          ap.StartDateTime,
          ap.EndDateTime,
          ap.Mode,
          ap.Location,
          ap.AppointmentStatusId,
          u.Name as CreatedByName
         FROM activitylog al
         LEFT JOIN activitytype at ON al.ActivityTypeId = at.ActivityTypeId
         LEFT JOIN appointment ap ON al.AppointmentId = ap.AppointmentId
         LEFT JOIN users u ON al.CreatedByUserId = u.UserId
         WHERE al.ActivityId = ? AND al.IsDeleted = 0`,
        [activityId]
      );

      if (rows.length > 0 && rows[0].Attachments) {
        try {
          rows[0].Attachments = JSON.parse(rows[0].Attachments);
        } catch (e) { }
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
        appointmentId,
        activityTypeId,
        createdByUserId,
        fromDate,
        toDate,
        search
      } = filters;

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      logger.debug(`Offset: ${offset}`);
      logger.debug(`Limit: ${limitNum}`);
      logger.debug(`Page: ${pageNum}`);

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
          ap.AppointmentId,
          ap.AppointmentNumber,
          ap.Title as AppointmentTitle,
          ap.StartDateTime,
          ap.EndDateTime,
          ap.Mode,
          ap.Location,
          ap.AppointmentStatusId,
          u.Name as CreatedByName
        FROM activitylog al
        LEFT JOIN activitytype at ON al.ActivityTypeId = at.ActivityTypeId
        LEFT JOIN appointment ap ON al.AppointmentId = ap.AppointmentId
        LEFT JOIN users u ON al.CreatedByUserId = u.UserId
        WHERE al.IsDeleted = 0
      `;

      const params = [];

      if (appointmentId) {
        query += ' AND al.AppointmentId = ?';
        params.push(appointmentId);
      }

      if (activityTypeId) {
        query += ' AND al.ActivityTypeId = ?';
        params.push(activityTypeId);
      }

      if (createdByUserId) {
        query += ' AND al.CreatedByUserId = ?';
        params.push(createdByUserId);
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
        query += ' AND (al.Subject LIKE ? OR al.Description LIKE ? OR ap.Title LIKE ? OR ap.AppointmentNumber LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const countQuery = query.replace(
        /SELECT[\s\S]*FROM/,
        'SELECT COUNT(*) as total FROM'
      );

      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      query += ' ORDER BY al.ActivityDate DESC, al.ActivityId DESC LIMIT ? OFFSET ?';
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

  // Get activities by appointment
  getByAppointmentId: async (appointmentId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          al.*,
          at.TypeName as ActivityTypeName,
          u.Name as CreatedByName
         FROM activitylog al
         LEFT JOIN activitytype at ON al.ActivityTypeId = at.ActivityTypeId
         LEFT JOIN users u ON al.CreatedByUserId = u.UserId
         WHERE al.AppointmentId = ? AND al.IsDeleted = 0
         ORDER BY al.ActivityDate DESC`,
        [appointmentId]
      );

      rows.forEach(row => {
        if (row.Attachments) {
          try {
            row.Attachments = JSON.parse(row.Attachments);
          } catch (e) { }
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting activities by appointment:', error);
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
          ap.AppointmentNumber,
          ap.Title as AppointmentTitle,
          ap.StartDateTime,
          ap.EndDateTime,
          ap.Mode,
          ap.Location
         FROM activitylog al 
         LEFT JOIN activitytype at ON al.ActivityTypeId = at.ActivityTypeId 
         LEFT JOIN appointment ap ON al.AppointmentId = ap.AppointmentId 
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