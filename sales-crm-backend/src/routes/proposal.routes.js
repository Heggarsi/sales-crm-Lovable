const express = require('express');
const router = express.Router();
const ProposalController = require('../controllers/proposal.controller');
const proposalValidation = require('../validations/proposalValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission, isAdminOrManager } = require('../middlewares/rbac.middleware');
const { upload, handleMulterError } = require('../middlewares/upload.middleware');
const { PERMISSIONS } = require('../config/constants');

// All proposal routes require authentication
router.use(authenticate);

// ==================== HELPER ENDPOINTS ====================

// Get proposal statuses
router.get('/statuses', ProposalController.getProposalStatuses);

// Get rejection reasons
router.get('/rejection-reasons', ProposalController.getRejectionReasons);

// ==================== ADVANCED FEATURES ====================

// Get pending approvals (Manager/Admin only)
router.get(
  '/pending-approval',
  isAdminOrManager,
  ProposalController.getPendingApprovals
);

// Get expiring proposals
router.get(
  '/expiring-soon',
  checkPermission(PERMISSIONS.READ_PROPOSAL),
  proposalValidation.getExpiringProposals,
  validate,
  ProposalController.getExpiringProposals
);

// Generate proposal report
router.get(
  '/report',
  checkPermission(PERMISSIONS.VIEW_REPORTS),
  ProposalController.generateProposalReport
);

// ==================== BASIC PROPOSAL CRUD ====================

// Create proposal
router.post(
  '/',
  checkPermission(PERMISSIONS.CREATE_PROPOSAL),
  proposalValidation.createProposal,
  validate,
  ProposalController.createProposal
);

// Get all proposals (with filtering for Sales Person)
router.get(
  '/',
  checkPermission(PERMISSIONS.READ_PROPOSAL),
  ProposalController.getAllProposals
);

// Get proposal by ID
router.get(
  '/:id',
  proposalValidation.getProposalById,
  validate,
  checkPermission(PERMISSIONS.READ_PROPOSAL),
  ProposalController.getProposalById
);

// Update proposal (only in Draft status)
router.put(
  '/:id',
  proposalValidation.updateProposal,
  validate,
  checkPermission(PERMISSIONS.UPDATE_PROPOSAL),
  ProposalController.updateProposal
);

// Delete proposal (Admin & Sales Manager only)
router.delete(
  '/:id',
  proposalValidation.deleteProposal,
  validate,
  isAdminOrManager,
  ProposalController.deleteProposal
);

// ==================== PROPOSAL ACTIONS ====================

// Submit proposal
router.post(
  '/:id/submit',
  proposalValidation.submitProposal,
  validate,
  checkPermission(PERMISSIONS.CREATE_PROPOSAL),
  ProposalController.submitProposal
);

// Approve proposal (Manager/Admin only)
router.post(
  '/:id/approve',
  proposalValidation.approveProposal,
  validate,
  checkPermission(PERMISSIONS.APPROVE_PROPOSAL),
  ProposalController.approveProposal
);

// Reject proposal (Manager/Admin only)
router.post(
  '/:id/reject',
  proposalValidation.rejectProposal,
  validate,
  checkPermission(PERMISSIONS.REJECT_PROPOSAL),
  ProposalController.rejectProposal
);

// Create revision (from rejected proposal)
router.post(
  '/:id/create-revision',
  proposalValidation.createRevision,
  validate,
  checkPermission(PERMISSIONS.CREATE_PROPOSAL),
  ProposalController.createRevision
);

// ==================== DOCUMENT MANAGEMENT ====================

// Upload proposal document (PDF only)
router.post(
  '/:id/upload-document',
  proposalValidation.uploadDocument,
  validate,
  checkPermission(PERMISSIONS.UPDATE_PROPOSAL),
  upload.single('proposalDocument'),
  handleMulterError,
  ProposalController.uploadDocument
);

// Download proposal document
router.get(
  '/:id/download-document',
  proposalValidation.downloadDocument,
  validate,
  checkPermission(PERMISSIONS.READ_PROPOSAL),
  ProposalController.downloadDocument
);

// ==================== LINKING & RELATIONSHIPS ====================

// Link appointment to proposal
router.post(
  '/:id/link-appointment',
  proposalValidation.linkAppointment,
  validate,
  checkPermission(PERMISSIONS.UPDATE_PROPOSAL),
  ProposalController.linkAppointment
);

// Get proposals by opportunity
router.get(
  '/opportunity/:opportunityId',
  proposalValidation.getProposalsByOpportunity,
  validate,
  checkPermission(PERMISSIONS.READ_PROPOSAL),
  ProposalController.getProposalsByOpportunity
);

module.exports = router;

