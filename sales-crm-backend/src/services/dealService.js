const DealModel = require('../models/DealModel');
const DealStageModel = require('../models/DealStageModel');
const ProposalModel = require('../models/ProposalModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES, DEAL_STAGE, PROPOSAL_STATUS } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const DealService = {
  createDeal: async (dealData, createdBy) => {
    try {
      const dealNumber = await DealModel.getNextDealNumber();
      const dealId = await DealModel.create({
        ...dealData,
        DealNumber: dealNumber,
        ClosingDate: helpers.formatDateForMySQL(dealData.ClosingDate),
        CreatedBy: createdBy
      });
      return await DealModel.findById(dealId);
    } catch (error) {
      logger.error('Create deal error:', error);
      throw error;
    }
  },

  getAllDeals: async (filters, user) => {
    try {
      // Sales Person can only see their assigned deals
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.AssignedToUserId = user.UserId;
      }
      
      const result = await DealModel.findAll(filters);
      return helpers.formatPaginationResponse(
        result.deals,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all deals error:', error);
      throw error;
    }
  },

  getDealById: async (dealId, user) => {
    try {
      const deal = await DealModel.findById(dealId);
      if (!deal) throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);

      // Ownership check
      if (user.RoleId === ROLES.SALES_PERSON && deal.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only access deals assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      return deal;
    } catch (error) {
      logger.error('Get deal by ID error:', error);
      throw error;
    }
  },

  updateDeal: async (dealId, updateData, user) => {
    try {
      const deal = await DealModel.findById(dealId);
      if (!deal) throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);

      // Ownership check
      if (user.RoleId === ROLES.SALES_PERSON && deal.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only update deals assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      // Deal Stage Transition Validations
      if (updateData.DealStageId) {
        const newStage = parseInt(updateData.DealStageId);
        const proposals = await ProposalModel.getByDealId(dealId);

        // 1. Proposal Stage Check: Must have at least one proposal
        if (newStage === DEAL_STAGE.PROPOSAL_QUOTE) {
          if (proposals.length === 0) {
            throw new AppError('Cannot move to Proposal stage without a proposal record. Please create a proposal first.', HTTP_STATUS.BAD_REQUEST);
          }
        }

        // 2. Negotiation Stage Check: Must have a proposal in 'Under Review' status
        if (newStage === DEAL_STAGE.NEGOTIATION_REVIEW) {
          const hasUnderReview = proposals.some(p => p.ProposalStatusId === PROPOSAL_STATUS.UNDER_REVIEW);
          if (!hasUnderReview) {
            throw new AppError('Cannot move to Negotiation stage. At least one proposal must be "Under Review".', HTTP_STATUS.BAD_REQUEST);
          }
        }

        // 3. Closed Won Check: Must have an 'Approved' proposal
        if (newStage === DEAL_STAGE.CLOSED_WON) {
          const hasApproved = proposals.some(p => p.ProposalStatusId === PROPOSAL_STATUS.APPROVED);
          if (!hasApproved) {
            throw new AppError('Cannot move to Closed Won. At least one proposal must be "Approved".', HTTP_STATUS.BAD_REQUEST);
          }
        }

        // 4. Closed Lost Check: Must have a 'Rejected' proposal
        if (newStage === DEAL_STAGE.CLOSED_LOST) {
          const hasRejected = proposals.some(p => p.ProposalStatusId === PROPOSAL_STATUS.REJECTED);
          if (!hasRejected) {
            throw new AppError('Cannot move to Closed Lost. At least one proposal must be "Rejected".', HTTP_STATUS.BAD_REQUEST);
          }
        }
      }

      const dataToUpdate = { ...updateData };
      if (dataToUpdate.ClosingDate) {
        dataToUpdate.ClosingDate = helpers.formatDateForMySQL(dataToUpdate.ClosingDate);
      }

      // Remove undefined properties to prevent MySQL bind errors
      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === undefined) {
          delete dataToUpdate[key];
        }
      });

      dataToUpdate.UpdatedBy = user.UserId;

      await DealModel.update(dealId, dataToUpdate);
      return await DealModel.findById(dealId);
    } catch (error) {
      logger.error('Update deal error:', error);
      throw error;
    }
  },

  deleteDeal: async (dealId, user) => {
    try {
      const deal = await DealModel.findById(dealId);
      if (!deal) throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);

      // Ownership check
      if (user.RoleId === ROLES.SALES_PERSON && deal.AssignedToUserId !== user.UserId) {
        throw new AppError('You can only delete deals assigned to you', HTTP_STATUS.FORBIDDEN);
      }

      await DealModel.delete(dealId, user.UserId);
      return true;
    } catch (error) {
      logger.error('Delete deal error:', error);
      throw error;
    }
  },

  getDealStages: async () => {
    try {
      return await DealStageModel.findAll();
    } catch (error) {
      logger.error('Get deal stages error:', error);
      throw error;
    }
  },

  getDealStageById: async (id) => {
    try {
      const stage = await DealStageModel.findById(id);
      if (!stage) throw new AppError('Deal stage not found', HTTP_STATUS.NOT_FOUND);
      return stage;
    } catch (error) {
      logger.error('Get deal stage by ID error:', error);
      throw error;
    }
  },

  createDealStage: async (data) => {
    try {
      const id = await DealStageModel.create(data);
      return await DealStageModel.findById(id);
    } catch (error) {
      logger.error('Create deal stage error:', error);
      throw error;
    }
  },

  updateDealStage: async (id, data) => {
    try {
      await DealStageModel.update(id, data);
      return await DealStageModel.findById(id);
    } catch (error) {
      logger.error('Update deal stage error:', error);
      throw error;
    }
  },

  deleteDealStage: async (id) => {
    try {
      await DealStageModel.delete(id);
      return true;
    } catch (error) {
      logger.error('Delete deal stage error:', error);
      throw error;
    }
  }
};

module.exports = DealService;
