const { pool } = require('../config/database');
const logger = require('../utils/logger');

const ProposalAppointmentModel = {

  // Link proposal to appointment
  create: async (proposalId, appointmentId) => {
    try {
      const [result] = await pool.query(
        `INSERT INTO proposalappointment (ProposalId, AppointmentId, IsDeleted, CreatedAt, UpdatedAt)
         VALUES (?, ?, 0, NOW(), NOW())`,
        [proposalId, appointmentId]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error linking proposal to appointment:', error);
      throw error;
    }
  },

  // Check if a link already exists
  exists: async (proposalId, appointmentId) => {
    const [rows] = await pool.query(
      `SELECT 1
       FROM proposalappointment
       WHERE ProposalId = ? AND AppointmentId = ? AND IsDeleted = 0
       LIMIT 1`,
      [proposalId, appointmentId]
    );

    return rows.length > 0;
  },

  // Get appointments linked to a proposal
  getByProposalId: async (proposalId) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          pa.*,
          a.AppointmentNumber,
          a.Title,
          a.StartDateTime,
          a.EndDateTime,
          a.Duration,
          a.Mode,
          a.Location,
          a.MeetingLink,
          a.Outcome,
          a.AppointmentStatusId,
          ast.StatusName AS AppointmentStatusName
         FROM proposalappointment pa
         LEFT JOIN appointment a   ON pa.AppointmentId = a.AppointmentId
         LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
         WHERE pa.ProposalId = ? AND pa.IsDeleted = 0
         ORDER BY a.StartDateTime DESC`,
        [proposalId]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting appointments by proposal:', error);
      throw error;
    }
  },

  // Get proposals linked to an appointment
  getByAppointmentId: async (appointmentId) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          pa.*,
          p.ProposalNumber,
          p.ProposalTitle,
          p.ProposalAmount,
          p.Currency
         FROM proposalappointment pa
         LEFT JOIN proposal p ON pa.ProposalId = p.ProposalId
         WHERE pa.AppointmentId = ? AND pa.IsDeleted = 0`,
        [appointmentId]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting proposals by appointment:', error);
      throw error;
    }
  },

  // ─── Get All (with filters + pagination) ─────────────────────────────────
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        leadId,
        contactId,
        accountId,
        dealId,
        appointmentStatusId,
        createdByUserId,
        assignedToUserId,
        fromDate,
        toDate,
        search,
        requireDealId = false  // New parameter to filter appointments with DealId
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT
          a.AppointmentId,
          a.AppointmentNumber,
          a.LeadId, a.ContactId, a.AccountId, a.DealId,
          a.Title,
          a.Agenda,
          a.StartDateTime,
          a.EndDateTime,
          a.Duration,
          a.Mode,
          a.Location,
          a.MeetingLink,
          a.Outcome,
          a.AppointmentStatusId,
          a.NextFollowUpDate,
          a.ReminderEnabled,
          a.ReminderMinutesBefore,
          a.AttendeesList,
          a.CreatedAt,
          ast.StatusName                          AS AppointmentStatusName,
          l.LeadNumber,
          l.FirstName                             AS LeadFirstName,
          l.LastName                              AS LeadLastName,
          l.CompanyName                           AS LeadCompanyName,
          l.AssignedToUserId                      AS LeadAssignedToUserId,
          con.FirstName                           AS ContactFirstName,
          con.LastName                            AS ContactLastName,
          acc.AccountName,
          d.DealName,
          u.Name                                  AS CreatedByName
        FROM appointment a
        LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
        LEFT JOIN leads    l   ON a.LeadId    = l.LeadId
        LEFT JOIN contacts con ON a.ContactId = con.ContactId
        LEFT JOIN accounts acc ON a.AccountId = acc.AccountId
        LEFT JOIN deals    d   ON a.DealId    = d.DealId
        LEFT JOIN users    u   ON a.CreatedByUserId = u.UserId
        WHERE a.IsDeleted = 0
      `;

      const params = [];

      // Filter to only include appointments with DealId
      if (requireDealId) {
        query += ' AND a.DealId IS NOT NULL';
      }

      if (leadId) {
        query += ' AND a.LeadId = ?';
        params.push(leadId);
      }

      if (contactId) {
        query += ' AND a.ContactId = ?';
        params.push(contactId);
      }

      if (accountId) {
        query += ' AND a.AccountId = ?';
        params.push(accountId);
      }

      if (dealId) {
        query += ' AND a.DealId = ?';
        params.push(dealId);
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
        query += ' AND a.StartDateTime >= ?';
        params.push(fromDate);
      }

      if (toDate) {
        query += ' AND a.StartDateTime <= ?';
        params.push(toDate);
      }

      if (search) {
        query += `
          AND (
            a.Title           LIKE ? OR
            l.FirstName       LIKE ? OR l.LastName  LIKE ? OR l.CompanyName LIKE ? OR
            con.FirstName     LIKE ? OR con.LastName LIKE ? OR
            acc.AccountName   LIKE ? OR
            d.DealName        LIKE ?
          )`;
        const s = `%${search}%`;
        params.push(s, s, s, s, s, s, s, s);
      }

      // Total count
      const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) AS total FROM');
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      // Paginated results
      query += ' ORDER BY a.StartDateTime DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      rows.forEach(row => {
        if (row.AttendeesList) {
          try { row.AttendeesList = JSON.parse(row.AttendeesList); } catch (e) { /* keep */ }
        }
      });

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

  // Soft-delete a link
  delete: async (proposalAppointmentId) => {
    try {
      const [result] = await pool.query(
        `UPDATE proposalappointment
         SET IsDeleted = 1, UpdatedAt = NOW()
         WHERE ProposalAppointmentId = ?`,
        [proposalAppointmentId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting proposal-appointment link:', error);
      throw error;
    }
  },

  // Soft-delete a link by IDs
  deleteByIds: async (proposalId, appointmentId) => {
    try {
      const [result] = await pool.query(
        `UPDATE proposalappointment
         SET IsDeleted = 1, UpdatedAt = NOW()
         WHERE ProposalId = ? AND AppointmentId = ?`,
        [proposalId, appointmentId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting proposal-appointment link by IDs:', error);
      throw error;
    }
  }

};

module.exports = ProposalAppointmentModel;