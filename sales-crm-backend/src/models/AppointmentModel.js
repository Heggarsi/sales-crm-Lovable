const { pool } = require('../config/database');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const AppointmentModel = {
  // Create appointment
  create: async (appointmentData) => {
    try {
      const {
        LeadId,
        Title,
        MeetingDate,
        Duration,
        Mode,
        Location,
        Agenda,
        AttendeesList,
        AppointmentStatusId,
        CreatedByUserId
      } = appointmentData;

      const AppointmentNumber = helpers.generateUniqueNumber('APPT');

      const [result] = await pool.query(
        `INSERT INTO appointment (
          AppointmentNumber, LeadId, Title, MeetingDate, Duration, Mode,
          Location, Agenda, AttendeesList, AppointmentStatusId,
          CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          AppointmentNumber, LeadId, Title, MeetingDate, Duration, Mode,
          Location, Agenda, 
          typeof AttendeesList === 'object' ? JSON.stringify(AttendeesList) : AttendeesList,
          AppointmentStatusId || 1, // Default: Scheduled
          CreatedByUserId
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Find appointment by ID
  findById: async (appointmentId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          a.*,
          ast.StatusName as AppointmentStatusName,
          l.LeadNumber,
          l.CustomerName,
          l.Email as LeadEmail,
          l.Phone as LeadPhone,
          l.CompanyName,
          l.AssignedToUserId,
          u.Name as CreatedByName
         FROM appointment a
         LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
         LEFT JOIN leads l ON a.LeadId = l.LeadId
         LEFT JOIN users u ON a.CreatedByUserId = u.UserId
         WHERE a.AppointmentId = ? AND a.IsDeleted = 0`,
        [appointmentId]
      );

      if (rows.length > 0 && rows[0].AttendeesList) {
        try {
          rows[0].AttendeesList = JSON.parse(rows[0].AttendeesList);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding appointment by ID:', error);
      throw error;
    }
  },

  // Get all appointments with filters
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        leadId,
        appointmentStatusId,
        createdByUserId,
        assignedToUserId, // For filtering by lead assignment
        fromDate,
        toDate,
        search
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          a.AppointmentId,
          a.AppointmentNumber,
          a.Title,
          a.MeetingDate,
          a.Duration,
          a.Mode,
          a.Location,
          a.AppointmentStatusId,
          a.CreatedAt,
          ast.StatusName as AppointmentStatusName,
          l.LeadId,
          l.LeadNumber,
          l.CustomerName,
          l.CompanyName,
          l.AssignedToUserId,
          u.Name as CreatedByName
        FROM appointment a
        LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
        LEFT JOIN leads l ON a.LeadId = l.LeadId
        LEFT JOIN users u ON a.CreatedByUserId = u.UserId
        WHERE a.IsDeleted = 0
      `;

      const params = [];

      if (leadId) {
        query += ' AND a.LeadId = ?';
        params.push(leadId);
      }

      if (appointmentStatusId) {
        query += ' AND a.AppointmentStatusId = ?';
        params.push(appointmentStatusId);
      }

      if (createdByUserId) {
        query += ' AND a.CreatedByUserId = ?';
        params.push(createdByUserId);
      }

      if (assignedToUserId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(assignedToUserId);
      }

      if (fromDate) {
        query += ' AND a.MeetingDate >= ?';
        params.push(fromDate);
      }

      if (toDate) {
        query += ' AND a.MeetingDate <= ?';
        params.push(toDate);
      }

      if (search) {
        query += ' AND (a.Title LIKE ? OR l.CustomerName LIKE ? OR l.CompanyName LIKE ?)';
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
      query += ' ORDER BY a.MeetingDate DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        appointments: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all appointments:', error);
      throw error;
    }
  },

  // Update appointment
  update: async (appointmentId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'Title', 'MeetingDate', 'Duration', 'Mode', 'Location',
        'Agenda', 'AttendeesList', 'AppointmentStatusId'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'AttendeesList' && typeof updateData[field] === 'object') {
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
      params.push(appointmentId);

      const [result] = await pool.query(
        `UPDATE appointment SET ${fields.join(', ')} WHERE AppointmentId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating appointment:', error);
      throw error;
    }
  },

  // Update appointment status
  updateStatus: async (appointmentId, statusId) => {
    try {
      const [result] = await pool.query(
        `UPDATE appointment 
         SET AppointmentStatusId = ?, UpdatedAt = NOW() 
         WHERE AppointmentId = ?`,
        [statusId, appointmentId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Delete appointment (soft delete)
  delete: async (appointmentId) => {
    try {
      const [result] = await pool.query(
        `UPDATE appointment 
         SET IsDeleted = 1, UpdatedAt = NOW() 
         WHERE AppointmentId = ?`,
        [appointmentId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting appointment:', error);
      throw error;
    }
  },

  // Get appointments by lead
  getByLeadId: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          a.*,
          ast.StatusName as AppointmentStatusName,
          u.Name as CreatedByName
         FROM appointment a
         LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
         LEFT JOIN users u ON a.CreatedByUserId = u.UserId
         WHERE a.LeadId = ? AND a.IsDeleted = 0
         ORDER BY a.MeetingDate DESC`,
        [leadId]
      );

      rows.forEach(row => {
        if (row.AttendeesList) {
          try {
            row.AttendeesList = JSON.parse(row.AttendeesList);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting appointments by lead:', error);
      throw error;
    }
  },

  // Check if appointment is completed
  isCompleted: async (appointmentId) => {
    try {
      const [rows] = await pool.query(
        'SELECT AppointmentStatusId FROM appointment WHERE AppointmentId = ? AND IsDeleted = 0',
        [appointmentId]
      );

      if (rows.length === 0) return false;

      // Status 2 = Completed
      return rows[0].AppointmentStatusId === 2;
    } catch (error) {
      logger.error('Error checking if appointment is completed:', error);
      throw error;
    }
  },

  // Find one appointment by filter
  findOne: async (filter = {}) => {
    try {
      let query = 'SELECT * FROM appointment WHERE IsDeleted = 0';
      const params = [];
  
      // Filter by AppointmentId
      if (filter.AppointmentId) {
        query += ' AND AppointmentId = ?';
        params.push(filter.AppointmentId);
      }
  
      // Filter by LeadId
      if (filter.LeadId) {
        query += ' AND LeadId = ?';
        params.push(filter.LeadId);
      }
  
      // Filter by exact MeetingDate
      if (filter.MeetingDate) {
        query += ' AND MeetingDate = ?';
        params.push(filter.MeetingDate);
      }
  
      // Filter by a date range (same day check)
      if (filter.startOfDay && filter.endOfDay) {
        query += ' AND MeetingDate >= ? AND MeetingDate <= ?';
        params.push(filter.startOfDay, filter.endOfDay);
      }
  
      // Filter by AppointmentNumber
      if (filter.AppointmentNumber) {
        query += ' AND AppointmentNumber = ?';
        params.push(filter.AppointmentNumber);
      }
  
      // Filter by AppointmentStatusId
      if (filter.AppointmentStatusId) {
        query += ' AND AppointmentStatusId = ?';
        params.push(filter.AppointmentStatusId);
      }
  
      // Only return one row
      query += ' LIMIT 1';
  
      const [rows] = await pool.query(query, params);
  
      // Parse AttendeesList if JSON
      if (rows.length > 0 && rows[0].AttendeesList) {
        try {
          rows[0].AttendeesList = JSON.parse(rows[0].AttendeesList);
        } catch (e) {
          // keep as string if not valid JSON
        }
      }
  
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding appointment:', error);
      throw error;
    }
  } 


};

module.exports = AppointmentModel;