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
  // ProposalAppointmentModel.js
exists: async (proposalId, appointmentId) => {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM ProposalAppointment
    WHERE ProposalId = ? AND AppointmentId = ?
    LIMIT 1
    `,
    [proposalId, appointmentId]
  );

  return rows.length > 0;
},

  // Get appointments linked to proposal
  getByProposalId: async (proposalId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          pa.*,
          a.AppointmentNumber,
          a.Title,
          a.MeetingDate,
          a.Mode
         FROM proposalappointment pa
         LEFT JOIN appointment a ON pa.AppointmentId = a.AppointmentId
         WHERE pa.ProposalId = ? AND pa.IsDeleted = 0`,
        [proposalId]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting appointments by proposal:', error);
      throw error;
    }
  },

  // Get proposals linked to appointment
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

  // Delete link
  delete: async (proposalAppointmentId) => {
    try {
      const [result] = await pool.query(
        'UPDATE proposalappointment SET IsDeleted = 1, UpdatedAt = NOW() WHERE ProposalAppointmentId = ?',
        [proposalAppointmentId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting proposal-appointment link:', error);
      throw error;
    }
  }
};

module.exports = ProposalAppointmentModel;