const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const ProposalService = require('../services/proposalService');
const LostOrderService = require('../services/lostOrderService');
const { HTTP_STATUS } = require('../config/constants');

const ProposalController = {
  // ==================== BASIC PROPOSAL CRUD ====================

  // Create proposal
  createProposal: asyncHandler(async (req, res) => {
    const proposal = await ProposalService.createProposal(req.body, req.user);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Proposal created successfully',
      data: proposal
    });
  }),

  // Get all proposals
  getAllProposals: asyncHandler(async (req, res) => {
    const { 
      page, limit, opportunityId, proposalStatusId, 
      minAmount, maxAmount, search 
    } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      opportunityId,
      proposalStatusId,
      minAmount,
      maxAmount,
      search
    };

    const result = await ProposalService.getAllProposals(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Proposals retrieved successfully',
      ...result
    });
  }),

  // Get proposal by ID
  getProposalById: asyncHandler(async (req, res) => {
    const proposal = await ProposalService.getProposalById(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Proposal retrieved successfully',
      data: proposal
    });
  }),

  // Update proposal
  updateProposal: asyncHandler(async (req, res) => {
    const proposal = await ProposalService.updateProposal(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Proposal updated successfully',
      data: proposal
    });
  }),

  // Delete proposal
  deleteProposal: asyncHandler(async (req, res) => {
    await ProposalService.deleteProposal(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  }),

  // ==================== PROPOSAL ACTIONS ====================

  // Submit proposal
  submitProposal: asyncHandler(async (req, res) => {
    const result = await ProposalService.submitProposal(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result
    });
  }),

  // Approve proposal
  approveProposal: asyncHandler(async (req, res) => {
    const result = await ProposalService.approveProposal(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result
    });
  }),

  // Reject proposal
  rejectProposal: asyncHandler(async (req, res) => {
    const result = await LostOrderService.rejectProposal(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result
    });
  }),

  // Create revision
  createRevision: asyncHandler(async (req, res) => {
    const result = await ProposalService.createRevision(req.params.id, req.user);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: result.message,
      data: result
    });
  }),

  // ==================== DOCUMENT MANAGEMENT ====================

  // Upload proposal document
  uploadDocument: asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded', HTTP_STATUS.BAD_REQUEST);
    }

    const proposal = await ProposalService.uploadDocument(
      req.params.id,
      req.file,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Proposal document uploaded successfully',
      data: {
        proposalId: proposal.ProposalId,
        documentPath: proposal.ProposalDocumentPath,
        fileName: req.file.originalname
      }
    });
  }),

  // Download proposal document
  downloadDocument: asyncHandler(async (req, res) => {
    const result = await ProposalService.downloadDocument(req.params.id, req.user);

    res.download(result.filePath, result.fileName);
  }),

  // ==================== LINKING & RELATIONSHIPS ====================

  // Link appointment to proposal
  linkAppointment: asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;
    const result = await ProposalService.linkAppointment(
      req.params.id,
      appointmentId,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message
    });
  }),

  // Get proposals by opportunity
  getProposalsByOpportunity: asyncHandler(async (req, res) => {
    const proposals = await ProposalService.getProposalsByOpportunity(
      req.params.opportunityId,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Proposals retrieved successfully',
      data: proposals
    });
  }),

  // ==================== ADVANCED FEATURES ====================

  // Get pending approvals
  getPendingApprovals: asyncHandler(async (req, res) => {
    const proposals = await ProposalService.getPendingApprovals(req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Pending approvals retrieved successfully',
      data: proposals,
      count: proposals.length
    });
  }),

  // Get expiring proposals
  getExpiringProposals: asyncHandler(async (req, res) => {
    const { days } = req.query;
    const proposals = await ProposalService.getExpiringProposals(days || 7, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Expiring proposals retrieved successfully',
      data: proposals,
      count: proposals.length
    });
  }),

  // Generate proposal report
  generateProposalReport: asyncHandler(async (req, res) => {
    const { startDate, endDate, statusId } = req.query;

    const filters = {
      startDate,
      endDate,
      statusId
    };

    const report = await ProposalService.generateProposalReport(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Proposal report generated successfully',
      data: report
    });
  }),

  // ==================== HELPER ENDPOINTS ====================

  // Get proposal statuses
  getProposalStatuses: asyncHandler(async (req, res) => {
    const statuses = await ProposalService.getProposalStatuses();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Proposal statuses retrieved successfully',
      data: statuses
    });
  }),

  // Get rejection reasons
  getRejectionReasons: asyncHandler(async (req, res) => {
    const reasons = LostOrderService.getRejectionReasons();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Rejection reasons retrieved successfully',
      data: reasons
    });
  })
};

module.exports = ProposalController;