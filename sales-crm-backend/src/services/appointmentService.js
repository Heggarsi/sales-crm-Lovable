const AppointmentModel = require('../models/AppointmentModel');
const AppointmentStatusModel = require('../models/AppointmentStatusModel');
const LeadModel = require('../models/LeadsModel');
const ContactModel = require('../models/ContactModel');
const AccountModel = require('../models/AccountModel');
const DealModel = require('../models/DealModel');
const ActivityLogModel = require('../models/ActivityLogModel');
const emailService = require('../utils/emailService');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const { pool } = require('../config/database');

// ─── Relation Resolution ───────────────────────────────────────────────────────
//
// Rules:
//   DealId supplied    → fetch deal → extract AccountId + ContactId from deal
//                                   → extract LeadId from that contact (if contact exists)
//   ContactId supplied → fetch contact → extract LeadId from contact
//   LeadId only        → nothing extra to extract
//   AccountId only     → nothing extra to extract
//
// After extraction all IDs are validated to actually exist.

const resolveAndEnrichRelations = async ({ LeadId, ContactId, AccountId, DealId }) => {
  let deal = null;
  let contact = null;
  let account = null;
  let lead = null;

  // ── Step 1: resolve Deal and cascade its FK fields ───────────────────────
  if (DealId) {
    deal = await DealModel.findById(DealId);
    if (!deal) throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);

    // Cascade: prefer caller-supplied values, fall back to deal's own FKs
    if (!AccountId && deal.AccountId) AccountId = deal.AccountId;
    if (!ContactId && deal.ContactId) ContactId = deal.ContactId;
  }

  // ── Step 2: resolve Contact and cascade LeadId ────────────────────────────
  if (ContactId) {
    contact = await ContactModel.findById(ContactId);
    if (!contact) throw new AppError('Contact not found', HTTP_STATUS.NOT_FOUND);

    // Cascade: if contact carries a LeadId, inherit it
    if (!LeadId && contact.LeadId) LeadId = contact.LeadId;
  }

  // ── Step 3: resolve Account ───────────────────────────────────────────────
  if (AccountId) {
    account = await AccountModel.findById(AccountId);
    if (!account) throw new AppError('Account not found', HTTP_STATUS.NOT_FOUND);
  }

  // ── Step 4: resolve Lead ──────────────────────────────────────────────────
  if (LeadId) {
    lead = await LeadModel.findById(LeadId);
    if (!lead) throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
  }

  return {
    // Resolved records
    lead, contact, account, deal,
    // Enriched IDs (may differ from what caller originally passed in)
    LeadId: LeadId || null,
    ContactId: ContactId || null,
    AccountId: AccountId || null,
    DealId: DealId || null
  };
};

// ─── Ownership check (SALES_PERSON gate) ──────────────────────────────────────
const assertOwnership = (appointment, user) => {
  if (user.RoleId !== ROLES.SALES_PERSON) return;

  const assignedTo = appointment.AssignedToUserId ?? null;

  if (assignedTo !== user.UserId) {
    throw new AppError(
      'You can only manage appointments linked to leads assigned to you',
      HTTP_STATUS.FORBIDDEN
    );
  }
};

// ─── Activity-log description helper ──────────────────────────────────────────
const buildRelationSummary = ({ lead, contact, account, deal }) => {
  const parts = [];
  if (lead) parts.push(`Lead: ${[lead.FirstName, lead.LastName].filter(Boolean).join(' ')}`);
  if (contact) parts.push(`Contact: ${[contact.FirstName, contact.LastName].filter(Boolean).join(' ')}`);
  if (account) parts.push(`Account: ${account.AccountName}`);
  if (deal) parts.push(`Deal: ${deal.DealName}`);
  return parts.join(' | ');
};

// ─── Service ───────────────────────────────────────────────────────────────────
const AppointmentService = {

  // ── Create Appointment ────────────────────────────────────────────────────
  createAppointment: async (appointmentData, user) => {
    try {
      let {
        LeadId, ContactId, AccountId, DealId,
        StartDateTime, EndDateTime,
        Title, Mode, Location, MeetingLink,
        Agenda, Duration
      } = appointmentData;

      // At least one relation required
      if (!LeadId && !ContactId && !AccountId && !DealId) {
        throw new AppError(
          'At least one relation (LeadId, ContactId, AccountId, or DealId) is required',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Resolve all relations + cascade IDs from deal/contact
      const relations = await resolveAndEnrichRelations({ LeadId, ContactId, AccountId, DealId });

      // Use enriched IDs for the rest of this method
      LeadId = relations.LeadId;
      ContactId = relations.ContactId;
      AccountId = relations.AccountId;
      DealId = relations.DealId;

      // Ownership: driven by linked lead when present
      if (user.RoleId === ROLES.SALES_PERSON && relations.lead) {
        if (relations.lead.AssignedToUserId !== user.UserId) {
          throw new AppError(
            'You can only create appointments for leads assigned to you',
            HTTP_STATUS.FORBIDDEN
          );
        }
      }

      // StartDateTime must be in the future
      const startDT = new Date(StartDateTime);
      if (startDT < new Date()) {
        throw new AppError('StartDateTime must be in the future', HTTP_STATUS.BAD_REQUEST);
      }

      // EndDateTime must be after StartDateTime
      if (EndDateTime && new Date(EndDateTime) <= startDT) {
        throw new AppError('EndDateTime must be after StartDateTime', HTTP_STATUS.BAD_REQUEST);
      }

      // Duplicate check: same lead + same calendar day
      if (LeadId) {
        const startOfDay = new Date(startDT);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startDT);
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await AppointmentModel.findOne({ LeadId, startOfDay, endOfDay });
        if (existing) {
          throw new AppError(
            `This lead already has an appointment on ${startDT.toDateString()}`,
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }

      // Persist with enriched IDs
      const appointmentId = await AppointmentModel.create({
        ...appointmentData,
        LeadId,
        ContactId,
        AccountId,
        DealId,
        CreatedByUserId: user.UserId,
        AppointmentStatusId: 1  // Scheduled
      });

      const newAppointment = await AppointmentModel.findById(appointmentId);

      // Activity log — attach to the appointment
      await ActivityLogModel.create({
        AppointmentId: appointmentId,
        ActivityTypeId: 3,  // Meeting
        Subject: `Appointment Scheduled: ${Title}`,
        Description: `Appointment scheduled for ${StartDateTime}. ${buildRelationSummary(relations)}`,
        Direction: 'Outbound',
        ActivityDate: helpers.formatDateTimeForMySQL(),
        CreatedByUserId: user.UserId
      });

      // Email — prefer lead email, fall back to contact
      const recipientEmail =
        relations.lead?.Email ??
        relations.contact?.Email ??
        null;

      if (recipientEmail) {
        await emailService.sendAppointmentEmail(recipientEmail, {
          title: Title,
          date: StartDateTime,
          endDate: EndDateTime,
          duration: Duration,
          mode: Mode,
          location: Location,
          meetingLink: MeetingLink
        });
      }

      logger.info('Appointment created successfully', { appointmentId, createdBy: user.UserId });
      return newAppointment;
    } catch (error) {
      logger.error('Create appointment error:', error);
      throw error;
    }
  },

  // ── Get All Appointments ──────────────────────────────────────────────────
  getAllAppointments: async (filters, user) => {
    try {
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
      }

      const result = await AppointmentModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.appointments,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all appointments error:', error);
      throw error;
    }
  },

  // ── Get Appointment by ID ─────────────────────────────────────────────────
  getAppointmentById: async (appointmentId, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);

      assertOwnership(appointment, user);
      return appointment;
    } catch (error) {
      logger.error('Get appointment by ID error:', error);
      throw error;
    }
  },

  // ── Update Appointment ────────────────────────────────────────────────────
  updateAppointment: async (appointmentId, updateData, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);

      assertOwnership(appointment, user);

      if ([2, 3].includes(appointment.AppointmentStatusId)) {
        throw new AppError(
          'Cannot update a completed or cancelled appointment',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Re-validate StartDateTime / EndDateTime ordering
      const newStart = updateData.StartDateTime
        ? new Date(updateData.StartDateTime)
        : new Date(appointment.StartDateTime);

      const newEnd = updateData.EndDateTime
        ? new Date(updateData.EndDateTime)
        : (appointment.EndDateTime ? new Date(appointment.EndDateTime) : null);

      if (newEnd && newEnd <= newStart) {
        throw new AppError('EndDateTime must be after StartDateTime', HTTP_STATUS.BAD_REQUEST);
      }

      await AppointmentModel.update(appointmentId, updateData);

      const updated = await AppointmentModel.findById(appointmentId);
      logger.info('Appointment updated successfully', { appointmentId, updatedBy: user.UserId });
      return updated;
    } catch (error) {
      logger.error('Update appointment error:', error);
      throw error;
    }
  },

  // ── Cancel Appointment ────────────────────────────────────────────────────
  cancelAppointment: async (appointmentId, reason, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);

      assertOwnership(appointment, user);

      if ([2, 3].includes(appointment.AppointmentStatusId)) {
        throw new AppError(
          'Appointment is already completed or cancelled',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      await AppointmentModel.updateStatus(appointmentId, 3);  // 3 = Cancelled

      await ActivityLogModel.create({
        AppointmentId: appointmentId,
        ActivityTypeId: 4,  // Note
        Subject: `Appointment Cancelled: ${appointment.Title}`,
        Description: reason || 'Appointment cancelled',
        Direction: 'Internal',
        ActivityDate: helpers.formatDateTimeForMySQL(),
        CreatedByUserId: user.UserId
      });

      const updated = await AppointmentModel.findById(appointmentId);
      logger.info('Appointment cancelled', { appointmentId, cancelledBy: user.UserId });
      return updated;
    } catch (error) {
      logger.error('Cancel appointment error:', error);
      throw error;
    }
  },

  // ── Complete Appointment ──────────────────────────────────────────────────
  completeAppointment: async (appointmentId, completionData, user) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);

      assertOwnership(appointment, user);

      if (![1, 4].includes(appointment.AppointmentStatusId)) {
        throw new AppError(
          'Only scheduled or rescheduled appointments can be completed',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const { MeetingNotes, Outcome, NextFollowUpDate, FollowUpNotes } = completionData;

      await connection.query(
        `UPDATE appointment
         SET AppointmentStatusId = 2,
             MeetingNotes        = COALESCE(?, MeetingNotes),
             Outcome             = COALESCE(?, Outcome),
             NextFollowUpDate    = COALESCE(?, NextFollowUpDate),
             FollowUpNotes       = COALESCE(?, FollowUpNotes),
             UpdatedAt           = NOW()
         WHERE AppointmentId = ?`,
        [
          MeetingNotes || null,
          Outcome || null,
          NextFollowUpDate || null,
          FollowUpNotes || null,
          appointmentId
        ]
      );

      await connection.query(
        `INSERT INTO activitylog (
          AppointmentId, ActivityTypeId, Subject, Description,
          Direction, Duration, Outcome,
          ActivityDate, CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, 3, ?, ?, 'Completed', ?, ?, NOW(), ?, 0, NOW(), NOW())`,
        [
          appointmentId,
          `Meeting Completed: ${appointment.Title}`,
          MeetingNotes || 'Meeting completed successfully',
          appointment.Duration,
          Outcome || 'Successful',
          user.UserId
        ]
      );

      await connection.commit();

      const updated = await AppointmentModel.findById(appointmentId);
      logger.info('Appointment completed', { appointmentId, completedBy: user.UserId });

      return {
        appointment: updated,
        message: 'Appointment completed successfully. You can now create Minutes of Meeting.'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Complete appointment error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // ── Reschedule Appointment ────────────────────────────────────────────────
  rescheduleAppointment: async (appointmentId, { StartDateTime, EndDateTime, reason }, user) => {
    try {
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);

      assertOwnership(appointment, user);

      if (![1, 4].includes(appointment.AppointmentStatusId)) {
        throw new AppError(
          'Only scheduled or rescheduled appointments can be rescheduled',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const newStart = new Date(StartDateTime);
      if (newStart < new Date()) {
        throw new AppError('New StartDateTime must be in the future', HTTP_STATUS.BAD_REQUEST);
      }

      if (EndDateTime && new Date(EndDateTime) <= newStart) {
        throw new AppError('EndDateTime must be after StartDateTime', HTTP_STATUS.BAD_REQUEST);
      }

      await AppointmentModel.update(appointmentId, {
        StartDateTime,
        EndDateTime: EndDateTime || null,
        AppointmentStatusId: 4  // Rescheduled
      });

      await ActivityLogModel.create({
        AppointmentId: appointmentId,
        ActivityTypeId: 4,
        Subject: `Appointment Rescheduled: ${appointment.Title}`,
        Description: `Rescheduled from ${appointment.StartDateTime} to ${StartDateTime}. Reason: ${reason || 'Not specified'}`,
        Direction: 'Internal',
        ActivityDate: helpers.formatDateTimeForMySQL(),
        CreatedByUserId: user.UserId
      });

      const updated = await AppointmentModel.findById(appointmentId);
      logger.info('Appointment rescheduled', { appointmentId, rescheduledBy: user.UserId });
      return updated;
    } catch (error) {
      logger.error('Reschedule appointment error:', error);
      throw error;
    }
  },

  // ── Get by Lead ───────────────────────────────────────────────────────────
  getAppointmentsByLead: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);
      if (!lead) throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);

      if (user.RoleId === ROLES.SALES_PERSON && lead.AssignedToUserId !== user.UserId) {
        throw new AppError(
          'You can only access appointments for leads assigned to you',
          HTTP_STATUS.FORBIDDEN
        );
      }

      return await AppointmentModel.getByLeadId(leadId);
    } catch (error) {
      logger.error('Get appointments by lead error:', error);
      throw error;
    }
  },

  // ── Get by Contact ────────────────────────────────────────────────────────
  getAppointmentsByContact: async (contactId, user) => {
    try {
      const contact = await ContactModel.findById(contactId);
      if (!contact) throw new AppError('Contact not found', HTTP_STATUS.NOT_FOUND);

      return await AppointmentModel.getByContactId(contactId);
    } catch (error) {
      logger.error('Get appointments by contact error:', error);
      throw error;
    }
  },

  // ── Get by Account ────────────────────────────────────────────────────────
  getAppointmentsByAccount: async (accountId, user) => {
    try {
      const account = await AccountModel.findById(accountId);
      if (!account) throw new AppError('Account not found', HTTP_STATUS.NOT_FOUND);

      return await AppointmentModel.getByAccountId(accountId);
    } catch (error) {
      logger.error('Get appointments by account error:', error);
      throw error;
    }
  },

  // ── Get by Deal ───────────────────────────────────────────────────────────
  getAppointmentsByDeal: async (dealId, user) => {
    try {
      const deal = await DealModel.findById(dealId);
      if (!deal) throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);

      return await AppointmentModel.getByDealId(dealId);
    } catch (error) {
      logger.error('Get appointments by deal error:', error);
      throw error;
    }
  },

  // ── Get Statuses ──────────────────────────────────────────────────────────
  getAppointmentStatuses: async () => {
    try {
      return await AppointmentStatusModel.getAll();
    } catch (error) {
      logger.error('Get appointment statuses error:', error);
      throw error;
    }
  }
};

module.exports = AppointmentService;