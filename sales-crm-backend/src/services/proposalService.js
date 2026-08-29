const ProposalModel = require('../models/ProposalModel');
const ProposalStatusModel = require('../models/ProposalStatusModel');
const ProposalAppointmentModel = require('../models/ProposalAppointmentModel');
const DealModel = require('../models/DealModel');
const AppointmentModel = require('../models/AppointmentModel')
const AuditLogModel = require('../models/AuditLogModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES, DEAL_STAGE } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const { generateProposalHash } = require('../utils/proposalHash.util');

const ProposalService = {
  // Get approval threshold from environment
  APPROVAL_THRESHOLD: parseFloat(process.env.PROPOSAL_APPROVAL_THRESHOLD) || 100000,

  // Create proposal
  createProposal: async (proposalData, user) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Generate content hash
      const { DealId } = proposalData;
      const deal = await DealModel.findById(DealId);

      if (!deal) {
        throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);
      }

      // Deal stage gate:
      // - Only allow proposals when deal is at/above stage 3 (Value Proposition)
      // - Closed Won (stage 6) and Closed Lost (stage 7) cannot create any new proposals
      if (deal.DealStageId === DEAL_STAGE.CLOSED_WON) {
        throw new AppError(
          'Cannot create a new proposal for a Closed Won deal',
          HTTP_STATUS.BAD_REQUEST
        );
      }
      if (deal.DealStageId === DEAL_STAGE.CLOSED_LOST) {
        throw new AppError(
          'Cannot create a new proposal for a Closed Lost deal',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (deal.DealStageId < DEAL_STAGE.VALUE_PROPOSITION) {
        throw new AppError(
          'Deal stage must be 3 or above to create a proposal',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (user.RoleId === ROLES.SALES_PERSON && deal.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only create proposals for deals assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      const contentHash = generateProposalHash({ ...proposalData, DealId });

      // ❗ Check against ALL previous versions
      const duplicateProposal =
        await ProposalModel.findByDealAndHash(
          DealId,
          contentHash
        );

      if (duplicateProposal) {
        throw new AppError(
          'A proposal with the same content already exists for this deal.',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Get next version number for this opportunity
      const maxVersion = await ProposalModel.getMaxVersionNo(DealId);
      const versionNo = maxVersion + 1;


      // Set validity date (default 30 days from now)
      const validityDays = parseInt(process.env.PROPOSAL_VALIDITY_DAYS) || 30;
      const validityDate = proposalData.ValidityDate ||
        helpers.formatDateTimeForMySQL(new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000));

      // Create proposal      
      const proposalId = await ProposalModel.create({
        ...proposalData,
        DealId,
        VersionNo: versionNo,
        ValidityDate: validityDate,
        ProposalStatusId: 1,
        ContentHash: contentHash,
        CreatedBy: user.UserId
      }, connection);

      await DealModel.moveToProposalStage(DealId, user.UserId, connection);
      const accountId = deal.AccountId || null;

      // Audit log
      const newProposal = await ProposalModel.findById(proposalId, connection);
      await connection.query(
        `INSERT INTO auditlog (
          TableName, RecordId, Action, NewValues, ChangedBy, ChangedAt
        ) VALUES ('proposal', ?, 'CREATE', ?, ?, NOW())`,
        [
          proposalId,
          JSON.stringify(newProposal),
          user.UserId
        ]
      );

      await connection.commit();

      logger.info('Proposal created successfully', { proposalId, createdBy: user.UserId });

      return newProposal;
    } catch (error) {
      await connection.rollback();
      logger.error('Create proposal error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get all proposals
  getAllProposals: async (filters, user) => {
    try {
      // Sales Person can only see proposals for their assigned deals
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
      }

      const result = await ProposalModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.proposals,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all proposals error:', error);
      throw error;
    }
  },

  // Get proposal by ID
  getProposalById: async (proposalId, user) => {
    try {
      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (proposal.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access proposals for deals assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Get linked appointments
      const appointments = await ProposalAppointmentModel.getByProposalId(proposalId);

      return {
        ...proposal,
        linkedAppointments: appointments
      };
    } catch (error) {
      logger.error('Get proposal by ID error:', error);
      throw error;
    }
  },

  // Update proposal
  updateProposal: async (proposalId, updateData, user) => {
    try {
      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // Ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (proposal.AssignedToUserId !== user.UserId) {
          throw new AppError(
            'You can only update proposals for deals assigned to you',
            HTTP_STATUS.FORBIDDEN
          );
        }
      }

      // Draft-only update
      const isDraft = await ProposalModel.isDraft(proposalId);
      if (!isDraft) {
        throw new AppError(
          'Can only update proposals in Draft status',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const oldValues = { ...proposal };

      // 🔑 Fields that affect hash
      const hashFields = [
        'ProposalTitle',
        'ProposalAmount',
        'Currency',
        'PaymentTerms',
        'DeliveryTerms',
        'ProposalDocumentPath'
      ];

      // Check if any hash field changed
      const hashFieldChanged = hashFields.some(
        field =>
          updateData[field] !== undefined &&
          updateData[field] !== proposal[field]
      );

      // 👉 Only recompute & validate hash if needed
      if (hashFieldChanged) {
        const hashInput = {
          DealId: proposal.DealId,
          ProposalTitle: updateData.ProposalTitle ?? proposal.ProposalTitle,
          ProposalAmount: updateData.ProposalAmount ?? proposal.ProposalAmount,
          Currency: updateData.Currency ?? proposal.Currency,
          PaymentTerms: updateData.PaymentTerms ?? proposal.PaymentTerms,
          DeliveryTerms: updateData.DeliveryTerms ?? proposal.DeliveryTerms,
          ProposalDocumentPath:
            updateData.ProposalDocumentPath ?? proposal.ProposalDocumentPath
        };

        const newHash = generateProposalHash(hashInput);

        // 🔥 IMPORTANT: Check against ALL versions except this one
        const duplicate =
          await ProposalModel.findByDealAndHashExcludingSelf(
            proposal.DealId,
            newHash,
            proposalId
          );

        if (duplicate) {
          throw new AppError(
            'Another proposal with the same content already exists for this deal.',
            HTTP_STATUS.BAD_REQUEST
          );
        }

        updateData.ContentHash = newHash;
      }

      // Perform update (non-hash fields update freely)
      await ProposalModel.update(proposalId, updateData);

      const updatedProposal = await ProposalModel.findById(proposalId);

      // Audit log
      await AuditLogModel.create({
        TableName: 'proposal',
        RecordId: proposalId,
        Action: 'UPDATE',
        OldValues: JSON.stringify(oldValues),
        NewValues: JSON.stringify(updatedProposal),
        ChangedBy: user.UserId
      });

      logger.info('Proposal updated successfully', {
        proposalId,
        updatedBy: user.UserId
      });

      return updatedProposal;
    } catch (error) {
      logger.error('Update proposal error:', error);
      throw error;
    }
  },
  // Delete proposal
  deleteProposal: async (proposalId, user) => {
    try {
      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        throw new AppError('Sales persons cannot delete proposals', HTTP_STATUS.FORBIDDEN);
      }

      await ProposalModel.delete(proposalId);

      // Audit log
      await AuditLogModel.create({
        TableName: 'proposal',
        RecordId: proposalId,
        Action: 'DELETE',
        OldValues: JSON.stringify(proposal),
        NewValues: null,
        ChangedBy: user.UserId
      });

      logger.info('Proposal deleted', { proposalId, deletedBy: user.UserId });

      return true;
    } catch (error) {
      logger.error('Delete proposal error:', error);
      throw error;
    }
  },

  // Submit proposal
  submitProposal: async (proposalId, user) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (proposal.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only submit proposals for deals assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Must be in Draft status
      const isDraft = await ProposalModel.isDraft(proposalId);
      if (!isDraft) {
        throw new AppError('Only draft proposals can be submitted', HTTP_STATUS.BAD_REQUEST);
      }

      // Block submission if deal already has another active submitted/approved proposal
      const conflictingProposal = await ProposalModel.hasActiveSubmittedProposal(
        proposal.DealId,
        proposalId
      );

      if (conflictingProposal) {
        const statusLabel = {
          2: 'Submitted',
          3: 'Under Review',
          4: 'Approved',
        }[conflictingProposal.ProposalStatusId] || 'active';

        throw new AppError(
          `Cannot submit proposal. Proposal ${conflictingProposal.ProposalNumber} for this deal is already in "${statusLabel}" status. Only one active proposal per deal is allowed.`,
          HTTP_STATUS.CONFLICT
        );
      }

      // Validate required fields for submission
      if (!proposal.ProposalDocumentPath) {
        throw new AppError('Proposal document must be uploaded before submission', HTTP_STATUS.BAD_REQUEST);
      }

      if (!proposal.PaymentTerms) {
        throw new AppError('Payment terms are required for submission', HTTP_STATUS.BAD_REQUEST);
      }

      if (!proposal.DeliveryTerms) {
        throw new AppError('Delivery terms are required for submission', HTTP_STATUS.BAD_REQUEST);
      }

      // All proposals require manager/admin approval
      const newStatus = 3; // Under Review
      const approvalMessage = `Proposal submitted for approval.`;

      // TODO: Send email notification to managers/admins

      await connection.query(
        `UPDATE proposal 
         SET ProposalStatusId = ?, SubmittedAt = NOW(), UpdatedAt = NOW()
         WHERE ProposalId = ?`,
        [newStatus, proposalId]
      );

      await DealModel.moveToNegotiationStage(proposal.DealId, user.UserId, connection);

      const accountId = await ProposalModel.getAccountIdByProposalId(proposalId);

      // Audit log
      await connection.query(
        `INSERT INTO auditlog (
          TableName, RecordId, Action, OldValues, NewValues, ChangedBy, ChangedAt
        ) VALUES ('proposal', ?, 'SUBMIT', ?, ?, ?, NOW())`,
        [
          proposalId,
          JSON.stringify({ ProposalStatusId: proposal.ProposalStatusId }),
          JSON.stringify({ ProposalStatusId: newStatus }),
          user.UserId
        ]
      );

      await connection.commit();

      const updatedProposal = await ProposalModel.findById(proposalId);

      logger.info('Proposal submitted', {
        proposalId,
        submittedBy: user.UserId,
      });

      return {
        proposal: updatedProposal,
        message: approvalMessage
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Submit proposal error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Approve proposal
  approveProposal: async (proposalId, approvalData, user) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // Only Manager/Admin can approve
      if (user.RoleId === ROLES.SALES_PERSON) {
        throw new AppError('Sales persons cannot approve proposals', HTTP_STATUS.FORBIDDEN);
      }

      // Must be in Submitted or Under Review status
      if (proposal.ProposalStatusId !== 2 && proposal.ProposalStatusId !== 3) {
        throw new AppError('Only submitted or under review proposals can be approved', HTTP_STATUS.BAD_REQUEST);
      }

      // Approve proposal
      await connection.query(
        `UPDATE proposal 
         SET ProposalStatusId = 4,
             ApprovedByUserId = ?,
             ApprovedAt = NOW(),
             DecisionDate = NOW(),
             UpdatedAt = NOW()
         WHERE ProposalId = ?`,
        [user.UserId, proposalId]
      );

      await ProposalModel.expireOtherProposals(proposal.DealId, proposalId, connection);
      await DealModel.moveToClosedWonStage(proposal.DealId, user.UserId, connection);

      const accountId = await ProposalModel.getAccountIdByProposalId(proposalId);


      // Audit log
      await connection.query(
        `INSERT INTO auditlog (
          TableName, RecordId, Action, OldValues, NewValues, ChangedBy, ChangedAt
        ) VALUES ('proposal', ?, 'APPROVE', ?, ?, ?, NOW())`,
        [
          proposalId,
          JSON.stringify({ ProposalStatusId: proposal.ProposalStatusId }),
          JSON.stringify({ ProposalStatusId: 4, ApprovedByUserId: user.UserId }),
          user.UserId
        ]
      );

      await connection.commit();

      const updatedProposal = await ProposalModel.findById(proposalId);

      logger.info('Proposal approved', { proposalId, approvedBy: user.UserId });

      return {
        proposal: updatedProposal,
        message: 'Proposal approved successfully. Ready to create sales order.',
        nextStep: 'Create Sales Order'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Approve proposal error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Reject proposal (handled by lostOrderService - see below)

  // Create revision
  createRevision: async (proposalId, user) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const parentProposal = await ProposalModel.findById(proposalId);

      if (!parentProposal) {
        throw new AppError('Parent proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      const deal = await DealModel.findById(parentProposal.DealId);
      if (!deal) {
        throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);
      }

      // Same deal stage gate as createProposal
      if (deal.DealStageId === DEAL_STAGE.CLOSED_WON) {
        throw new AppError(
          'Cannot create a new proposal revision for a Closed Won deal',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Parent deal must be Closed Lost (rejection always closes deal lost)
      if (deal.DealStageId !== DEAL_STAGE.CLOSED_LOST) {
        throw new AppError(
          'A revision can only be created when the deal is in Closed Lost stage',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (parentProposal.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only create revisions for proposals of deals assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Parent must be rejected
      const isRejected = await ProposalModel.isRejected(proposalId);
      if (!isRejected) {
        throw new AppError('Can only create revisions of rejected proposals', HTTP_STATUS.BAD_REQUEST);
      }

      const hashInput = {
        DealId: parentProposal.DealId,
        ProposalTitle: parentProposal.ProposalTitle + ' (Revised)',
        ProposalAmount: parentProposal.ProposalAmount,
        Currency: parentProposal.Currency,
        PaymentTerms: parentProposal.PaymentTerms,
        DeliveryTerms: parentProposal.DeliveryTerms,
        ProposalDocumentPath: parentProposal.ProposalDocumentPath || ''
      };
      const contentHash = generateProposalHash(hashInput);
      const versionno = await ProposalModel.getMaxVersionNo(parentProposal.DealId);

      // Create new proposal (revision)
      const newProposalId = await ProposalModel.create({
        DealId: parentProposal.DealId,
        ProposalTitle: parentProposal.ProposalTitle + ' (Revised)',
        ProposalAmount: parentProposal.ProposalAmount,
        Currency: parentProposal.Currency,
        VersionNo: versionno + 1,
        ParentProposalId: proposalId,
        ValidityDate: helpers.formatDateTimeForMySQL(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        PaymentTerms: parentProposal.PaymentTerms,
        DeliveryTerms: parentProposal.DeliveryTerms,
        InternalNotes: `Revision of ${parentProposal.ProposalNumber}. Previous rejection reason: ${parentProposal.RejectionReason}`,
        ProposalStatusId: 1, // Draft
        ContentHash: contentHash,
        CreatedBy: user.UserId
      }, connection);

      // Transition parent proposal from Rejected → Rejected Expired
      await ProposalModel.updateStatus(proposalId, 7, connection);


      // After — forcibly moves deal back from Closed Lost to Proposal/Price Quote
      await DealModel.moveToProposalStageForRevision(parentProposal.DealId, user.UserId, connection);


      // #Todo AuditLog Insertion.



      await connection.commit();

      const newProposal = await ProposalModel.findById(newProposalId);

      logger.info('Proposal revision created', {
        newProposalId,
        parentProposalId: proposalId,
        createdBy: user.UserId
      });

      return {
        newProposal,
        parentProposal,
        message: 'Proposal revision created successfully'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Create revision error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Upload proposal document
  uploadDocument: async (proposalId, file, user) => {
    try {
      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (proposal.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only upload documents for proposals of deals assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Can only upload for draft proposals
      const isDraft = await ProposalModel.isDraft(proposalId);
      if (!isDraft) {
        throw new AppError('Can only upload documents for draft proposals', HTTP_STATUS.BAD_REQUEST);
      }

      // Update proposal with document path
      await ProposalModel.update(proposalId, {
        ProposalDocumentPath: file.path
      });

      const updatedProposal = await ProposalModel.findById(proposalId);

      logger.info('Proposal document uploaded', { proposalId, uploadedBy: user.UserId });

      return updatedProposal;
    } catch (error) {
      logger.error('Upload document error:', error);
      throw error;
    }
  },

  // Download proposal document
  downloadDocument: async (proposalId, user) => {
    try {
      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (proposal.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only download documents for proposals of deals assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      if (!proposal.ProposalDocumentPath) {
        throw new AppError('No document uploaded for this proposal', HTTP_STATUS.NOT_FOUND);
      }

      // Check if file exists
      try {
        await fs.access(proposal.ProposalDocumentPath);
      } catch (err) {
        throw new AppError('Proposal document file not found', HTTP_STATUS.NOT_FOUND);
      }

      return {
        filePath: proposal.ProposalDocumentPath,
        fileName: path.basename(proposal.ProposalDocumentPath),
        proposal
      };
    } catch (error) {
      logger.error('Download document error:', error);
      throw error;
    }
  },

  // Link appointment to proposal
  linkAppointment: async (proposalId, appointmentId, user) => {
    try {
      const proposal = await ProposalModel.findById(proposalId);

      if (!proposal) {
        throw new AppError('Proposal not found', HTTP_STATUS.NOT_FOUND);
      }

      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check if appointment has DealId
      if (!appointment.DealId) {
        throw new AppError(
          'Appointment is not associated with any deal',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Check if proposal DealId matches appointment DealId
      if (proposal.DealId !== appointment.DealId) {
        throw new AppError(
          'Proposal and appointment must belong to the same deal',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (proposal.AssignedToUserId !== user.UserId) {
          throw new AppError(
            'You can only link appointments for proposals of deals assigned to you',
            HTTP_STATUS.FORBIDDEN
          );
        }
      }

      // Check if already linked
      const alreadyLinked = await ProposalAppointmentModel.exists(
        proposalId,
        appointmentId
      );

      if (alreadyLinked) {
        throw new AppError(
          'Appointment already linked to this proposal',
          HTTP_STATUS.CONFLICT
        );
      }

      await ProposalAppointmentModel.create(proposalId, appointmentId);

      logger.info('Appointment linked to proposal', {
        proposalId,
        appointmentId,
        dealId: proposal.DealId,
        linkedBy: user.UserId
      });

      return { success: true, message: 'Appointment linked successfully' };
    } catch (error) {
      logger.error('Link appointment error:', error);
      throw error;
    }
  },

  // Get proposals by deal
  getProposalsByDeal: async (dealId, user) => {
    try {
      const deal = await DealModel.findById(dealId);

      if (!deal) {
        throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);
      }

      // Ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (deal.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access proposals for deals assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const proposals = await ProposalModel.getByDealId(dealId);

      return proposals;
    } catch (error) {
      logger.error('Get proposals by deal error:', error);
      throw error;
    }
  },

  // Get all proposal-appointment links
  getAllProposalAppointments: async (filters, user) => {
    try {
      // Sales Person can only see their own links indirectly if needed, 
      // but usually this page might be for Managers/Admins.
      // For now, let's keep it simple or add Role check if necessary.

      const result = await ProposalAppointmentModel.getAll(filters);

      return result;
    } catch (error) {
      logger.error('Get all proposal appointments error:', error);
      throw error;
    }
  },

  // Delete proposal-appointment link
  deleteProposalAppointmentLink: async (proposalAppointmentId, user) => {
    try {
      const success = await ProposalAppointmentModel.delete(proposalAppointmentId);
      if (!success) {
        throw new AppError('Link not found or already deleted', HTTP_STATUS.NOT_FOUND);
      }

      return true;
    } catch (error) {
      logger.error('Delete proposal appointment link error:', error);
      throw error;
    }
  },

  // Get pending approvals
  getPendingApprovals: async (user) => {
    try {
      // Only managers/admins can see pending approvals
      if (user.RoleId === ROLES.SALES_PERSON) {
        return [];
      }

      const proposals = await ProposalModel.getPendingApprovals(user.UserId, user.RoleId);

      return proposals;
    } catch (error) {
      logger.error('Get pending approvals error:', error);
      throw error;
    }
  },

  // Get expiring proposals
  getExpiringProposals: async (days, user) => {
    try {
      const proposals = await ProposalModel.getExpiringSoon(days, user.UserId, user.RoleId);

      return proposals;
    } catch (error) {
      logger.error('Get expiring proposals error:', error);
      throw error;
    }
  },

  // Get proposal statuses
  getProposalStatuses: async () => {
    try {
      return await ProposalStatusModel.getAll();
    } catch (error) {
      logger.error('Get proposal statuses error:', error);
      throw error;
    }
  },

  // Generate proposal report
  generateProposalReport: async (filters, user) => {
    try {
      const { startDate, endDate, statusId } = filters;

      let query = `
        SELECT 
          p.ProposalId,
          p.ProposalNumber,
          p.ProposalTitle,
          p.ProposalAmount,
          p.Currency,
          p.VersionNo,
          p.SubmittedAt,
          p.ApprovedAt,
          p.RejectedAt,
          p.CreatedAt,
          ps.StatusName,
          d.DealName,
          d.DealNumber,
          a.AccountName,
          c.FirstName as ContactFirstName,
          c.LastName as ContactLastName,
          creator.Name as CreatedBy,
          approver.Name as ApprovedBy,
          DATEDIFF(
            COALESCE(p.DecisionDate, NOW()), 
            p.SubmittedAt
          ) as DaysToDecision
        FROM proposal p
        LEFT JOIN proposalstatus ps ON p.ProposalStatusId = ps.ProposalStatusId
        LEFT JOIN deals d ON p.DealId = d.DealId
        LEFT JOIN accounts a ON d.AccountId = a.AccountId
        LEFT JOIN contacts c ON d.ContactId = c.ContactId
        LEFT JOIN users creator ON p.CreatedBy = creator.UserId
        LEFT JOIN users approver ON p.ApprovedByUserId = approver.UserId
        WHERE p.IsDeleted = 0
      `;

      const params = [];

      // Sales Person filter
      if (user.RoleId === ROLES.SALES_PERSON) {
        query += ' AND d.AssignedToUserId = ?';
        params.push(user.UserId);
      }

      if (startDate) {
        query += ' AND p.CreatedAt >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND p.CreatedAt <= ?';
        params.push(endDate);
      }

      if (statusId) {
        query += ' AND p.ProposalStatusId = ?';
        params.push(statusId);
      }

      query += ' ORDER BY p.CreatedAt DESC';

      const [proposals] = await pool.query(query, params);

      // Calculate summary statistics
      const summary = {
        totalProposals: proposals.length,
        totalValue: proposals.reduce((sum, p) => sum + parseFloat(p.ProposalAmount || 0), 0),
        draftCount: proposals.filter(p => p.StatusName === 'Draft').length,
        submittedCount: proposals.filter(p => p.StatusName === 'Submitted').length,
        approvedCount: proposals.filter(p => p.StatusName === 'Approved').length,
        rejectedCount: proposals.filter(p => p.StatusName === 'Rejected').length,
        avgDaysToDecision: 0,
        approvalRate: 0
      };

      const decidedProposals = proposals.filter(p => p.DaysToDecision !== null);
      if (decidedProposals.length > 0) {
        summary.avgDaysToDecision = decidedProposals.reduce((sum, p) => sum + (p.DaysToDecision || 0), 0) / decidedProposals.length;
      }

      const totalDecided = summary.approvedCount + summary.rejectedCount;
      if (totalDecided > 0) {
        summary.approvalRate = ((summary.approvedCount / totalDecided) * 100).toFixed(2);
      }

      // Group by status
      const byStatus = proposals.reduce((acc, p) => {
        const status = p.StatusName;
        if (!acc[status]) {
          acc[status] = {
            count: 0,
            totalValue: 0
          };
        }
        acc[status].count++;
        acc[status].totalValue += parseFloat(p.ProposalAmount || 0);
        return acc;
      }, {});

      logger.info('Proposal report generated', { user: user.UserId, count: proposals.length });

      return {
        summary,
        byStatus,
        proposals,
        generatedAt: new Date(),
        generatedBy: user.Name
      };
    } catch (error) {
      logger.error('Generate proposal report error:', error);
      throw error;
    }
  }
};

module.exports = ProposalService;
