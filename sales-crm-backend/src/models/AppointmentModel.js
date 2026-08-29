const { pool } = require('../config/database');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const AppointmentModel = {

  // ─── Create ───────────────────────────────────────────────────────────────
  create: async (appointmentData) => {
    try {
      const {
        LeadId,
        ContactId,
        AccountId,
        DealId,
        Title,
        Agenda,
        MeetingNotes,
        StartDateTime,
        EndDateTime,
        Duration,
        Mode,
        Location,
        MeetingLink,
        Outcome,
        AppointmentStatusId,
        NextFollowUpDate,
        FollowUpNotes,
        AttendeesList,
        ReminderEnabled,
        ReminderMinutesBefore,
        CreatedByUserId
      } = appointmentData;

      const AppointmentNumber = helpers.generateUniqueNumber('APPT');

      // Convert attendees to valid JSON
      let attendeesJson = null;

      if (Array.isArray(AttendeesList)) {
        attendeesJson = JSON.stringify(AttendeesList);
      }
      else if (typeof AttendeesList === 'string' && AttendeesList.trim() !== '') {
        attendeesJson = JSON.stringify(
          AttendeesList
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)
        );
      }

      const [result] = await pool.query(
        `INSERT INTO appointment (
          AppointmentNumber,
          LeadId, ContactId, AccountId, DealId,
          Title, Agenda, MeetingNotes,
          StartDateTime, EndDateTime, Duration,
          Mode, Location, MeetingLink,
          Outcome, AppointmentStatusId,
          NextFollowUpDate, FollowUpNotes,
          AttendeesList,
          ReminderEnabled, ReminderMinutesBefore,
          CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (
          ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?,
          ?,
          ?, ?,
          ?, 0, NOW(), NOW()
        )`,
        [
          AppointmentNumber,
          LeadId || null,
          ContactId || null,
          AccountId || null,
          DealId || null,
          Title,
          Agenda || null,
          MeetingNotes || null,
          StartDateTime,
          EndDateTime || null,
          Duration || null,
          Mode,
          Location || null,
          MeetingLink || null,
          Outcome || null,
          AppointmentStatusId || 1,
          NextFollowUpDate || null,
          FollowUpNotes || null,
          attendeesJson,
          ReminderEnabled ? 1 : 0,
          ReminderMinutesBefore || null,
          CreatedByUserId
        ]
      );

      return result.insertId;

    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  },

  // ─── Find by ID ───────────────────────────────────────────────────────────
  findById: async (appointmentId) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          a.*,
          ast.StatusName                          AS AppointmentStatusName,

          -- Lead info
          l.LeadNumber,
          l.FirstName                             AS LeadFirstName,
          l.LastName                              AS LeadLastName,
          l.Email                                 AS LeadEmail,
          l.Phone                                 AS LeadPhone,
          l.CompanyName                           AS LeadCompanyName,
          l.AssignedToUserId                      AS LeadAssignedToUserId,

          -- Contact info
          con.ContactNumber,
          con.FirstName                           AS ContactFirstName,
          con.LastName                            AS ContactLastName,
          con.Email                               AS ContactEmail,
          con.Phone                               AS ContactPhone,

          -- Account info
          acc.AccountNumber,
          acc.AccountName,
          acc.Phone                               AS AccountPhone,

          -- Deal info
          d.DealNumber,
          d.DealName,

          -- Creator
          u.Name                                  AS CreatedByName
        FROM appointment a
        LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
        LEFT JOIN leads    l   ON a.LeadId    = l.LeadId
        LEFT JOIN contacts con ON a.ContactId = con.ContactId
        LEFT JOIN accounts acc ON a.AccountId = acc.AccountId
        LEFT JOIN deals    d   ON a.DealId    = d.DealId
        LEFT JOIN users    u   ON a.CreatedByUserId = u.UserId
        WHERE a.AppointmentId = ? AND a.IsDeleted = 0`,
        [appointmentId]
      );

      if (rows.length > 0 && rows[0].AttendeesList) {
        try {
          rows[0].AttendeesList = JSON.parse(rows[0].AttendeesList);
        } catch (e) { /* keep as string */ }
      }

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding appointment by ID:', error);
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
        requireDealId,
        requireLeadId,
        requireContactId,
        appointmentStatusId,
        createdByUserId,
        assignedToUserId,   // filter by lead's assigned user
        fromDate,
        toDate,
        search,
        includeProposals
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT
          a.AppointmentId,${includeProposals ? `
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'linkId', pa.ProposalAppointmentId,
                'proposalId', p.ProposalId,
                'proposalNumber', p.ProposalNumber,
                'proposalTitle', p.ProposalTitle
              )
            )
            FROM proposalappointment pa
            JOIN proposal p ON pa.ProposalId = p.ProposalId
            WHERE pa.AppointmentId = a.AppointmentId AND pa.IsDeleted = 0 AND p.IsDeleted = 0
          ) AS LinkedProposals,` : ''}
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
        const ids = Array.isArray(dealId) ? dealId : (typeof dealId === 'string' ? dealId.split(',').map(id => id.trim()) : [dealId]);
        query += ` AND a.DealId IN (${ids.map(() => '?').join(', ')})`;
        params.push(...ids);
      }

      if (requireDealId === 'true' || requireDealId === true || requireDealId === 1 || requireDealId === '1') {
        query += ' AND a.DealId IS NOT NULL';
      }

      if (requireLeadId === 'true' || requireLeadId === true || requireLeadId === 1 || requireLeadId === '1') {
        query += ' AND a.LeadId IS NOT NULL';
      }

      if (requireContactId === 'true' || requireContactId === true || requireContactId === 1 || requireContactId === '1') {
        query += ' AND a.ContactId IS NOT NULL';
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
      const countQuery = query.replace(/SELECT[\s\S]*?FROM\s+appointment\s+a/i, 'SELECT COUNT(*) AS total FROM appointment a');
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

  // ─── Update ───────────────────────────────────────────────────────────────
  update: async (appointmentId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'LeadId', 'ContactId', 'AccountId', 'DealId',
        'Title', 'Agenda', 'MeetingNotes',
        'StartDateTime', 'EndDateTime', 'Duration',
        'Mode', 'Location', 'MeetingLink',
        'Outcome', 'AppointmentStatusId',
        'NextFollowUpDate', 'FollowUpNotes',
        'AttendeesList',
        'ReminderEnabled', 'ReminderMinutesBefore'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          fields.push(`${field} = ?`);
          if (field === 'AttendeesList' && typeof updateData[field] === 'object') {
            params.push(JSON.stringify(updateData[field]));
          } else {
            params.push(updateData[field]);
          }
        }
      });

      if (fields.length === 0) return false;

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

  // ─── Update Status ────────────────────────────────────────────────────────
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

  // ─── Soft Delete ──────────────────────────────────────────────────────────
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

  // ─── Get by Lead ──────────────────────────────────────────────────────────
  getByLeadId: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          a.*,
          ast.StatusName AS AppointmentStatusName,
          u.Name         AS CreatedByName
         FROM appointment a
         LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
         LEFT JOIN users u ON a.CreatedByUserId = u.UserId
         WHERE a.LeadId = ? AND a.IsDeleted = 0
         ORDER BY a.StartDateTime DESC`,
        [leadId]
      );

      rows.forEach(row => {
        if (row.AttendeesList) {
          try { row.AttendeesList = JSON.parse(row.AttendeesList); } catch (e) { /* keep */ }
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting appointments by lead:', error);
      throw error;
    }
  },

  // ─── Get by Contact ───────────────────────────────────────────────────────
  getByContactId: async (contactId) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          a.*,
          ast.StatusName AS AppointmentStatusName,
          u.Name         AS CreatedByName
         FROM appointment a
         LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
         LEFT JOIN users u ON a.CreatedByUserId = u.UserId
         WHERE a.ContactId = ? AND a.IsDeleted = 0
         ORDER BY a.StartDateTime DESC`,
        [contactId]
      );

      rows.forEach(row => {
        if (row.AttendeesList) {
          try { row.AttendeesList = JSON.parse(row.AttendeesList); } catch (e) { /* keep */ }
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting appointments by contact:', error);
      throw error;
    }
  },

  // ─── Get by Account ───────────────────────────────────────────────────────
  getByAccountId: async (accountId) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          a.*,
          ast.StatusName AS AppointmentStatusName,
          u.Name         AS CreatedByName
         FROM appointment a
         LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
         LEFT JOIN users u ON a.CreatedByUserId = u.UserId
         WHERE a.AccountId = ? AND a.IsDeleted = 0
         ORDER BY a.StartDateTime DESC`,
        [accountId]
      );

      rows.forEach(row => {
        if (row.AttendeesList) {
          try { row.AttendeesList = JSON.parse(row.AttendeesList); } catch (e) { /* keep */ }
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting appointments by account:', error);
      throw error;
    }
  },

  // ─── Get by Deal ──────────────────────────────────────────────────────────
  getByDealId: async (dealId) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          a.*,
          ast.StatusName AS AppointmentStatusName,
          u.Name         AS CreatedByName
         FROM appointment a
         LEFT JOIN appointmentstatus ast ON a.AppointmentStatusId = ast.AppointmentStatusId
         LEFT JOIN users u ON a.CreatedByUserId = u.UserId
         WHERE a.DealId = ? AND a.IsDeleted = 0
         ORDER BY a.StartDateTime DESC`,
        [dealId]
      );

      rows.forEach(row => {
        if (row.AttendeesList) {
          try { row.AttendeesList = JSON.parse(row.AttendeesList); } catch (e) { /* keep */ }
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting appointments by deal:', error);
      throw error;
    }
  },

  // ─── Is Completed ─────────────────────────────────────────────────────────
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

  // ─── Find One ─────────────────────────────────────────────────────────────
  findOne: async (filter = {}) => {
    try {
      let query = 'SELECT * FROM appointment WHERE IsDeleted = 0';
      const params = [];

      if (filter.AppointmentId) {
        query += ' AND AppointmentId = ?';
        params.push(filter.AppointmentId);
      }

      if (filter.AppointmentNumber) {
        query += ' AND AppointmentNumber = ?';
        params.push(filter.AppointmentNumber);
      }

      if (filter.LeadId) {
        query += ' AND LeadId = ?';
        params.push(filter.LeadId);
      }

      if (filter.ContactId) {
        query += ' AND ContactId = ?';
        params.push(filter.ContactId);
      }

      if (filter.AccountId) {
        query += ' AND AccountId = ?';
        params.push(filter.AccountId);
      }

      if (filter.DealId) {
        query += ' AND DealId = ?';
        params.push(filter.DealId);
      }

      if (filter.AppointmentStatusId) {
        query += ' AND AppointmentStatusId = ?';
        params.push(filter.AppointmentStatusId);
      }

      // Exact StartDateTime match
      if (filter.StartDateTime) {
        query += ' AND StartDateTime = ?';
        params.push(filter.StartDateTime);
      }

      // Date range (e.g. same-day check)
      if (filter.startOfDay && filter.endOfDay) {
        query += ' AND StartDateTime >= ? AND StartDateTime <= ?';
        params.push(filter.startOfDay, filter.endOfDay);
      }

      query += ' LIMIT 1';

      const [rows] = await pool.query(query, params);

      if (rows.length > 0 && rows[0].AttendeesList) {
        try { rows[0].AttendeesList = JSON.parse(rows[0].AttendeesList); } catch (e) { /* keep */ }
      }

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding appointment:', error);
      throw error;
    }
  }

};

module.exports = AppointmentModel;