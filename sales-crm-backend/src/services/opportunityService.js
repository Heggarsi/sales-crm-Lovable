const OpportunityModel = require('../models/OpportunityModel');
const OpportunityStageModel = require('../models/OpportunityStageModel');
const OpportunityStatusModel = require('../models/OpportunityStatusModel');
const LeadModel = require('../models/LeadsModel');
const ActivityLogModel = require('../models/ActivityLogModel');
const AuditLogModel = require('../models/AuditLogModel');
const { AppError } = require('../middlewares/errorHandler.middleware');
const { HTTP_STATUS, ROLES, LEAD_STATUS } = require('../config/constants');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const { pool } = require('../config/database');

const OpportunityService = {
  // Create opportunity from qualified lead
  createOpportunity: async (opportunityData, user) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { LeadId } = opportunityData;

      // Check if lead exists
      const lead = await LeadModel.findById(LeadId);
      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only create opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Check if lead is qualified
      if (lead.LeadStatusId !== LEAD_STATUS.QUALIFIED) {
        throw new AppError('Opportunity can only be created from qualified leads', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if lead already has an active opportunity
      const hasActive = await OpportunityModel.hasActiveOpportunity(LeadId);
      if (hasActive) {
        throw new AppError('An active opportunity already exists for this lead', HTTP_STATUS.CONFLICT);
      }

      // Create opportunity
      const opportunityId = await OpportunityModel.create({
        ...opportunityData,
        CreatedByUserId: user.UserId,
        OpportunityStageId: 1, // Prospecting
        OpportunityStatusId: 1 // Active
      });

      // Update lead status to Converted
      await connection.query(
        'UPDATE leads SET LeadStatusId = ?, UpdatedBy = ?, UpdatedAt = NOW() WHERE LeadId = ?',
        [LEAD_STATUS.CONVERTED, user.UserId, LeadId]
      );

      // Log activity
      await connection.query(
        `INSERT INTO activitylog (
          LeadId, ActivityTypeId, Subject, Description, Direction,
          ActivityDate, CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, 4, ?, ?, 'Internal', NOW(), ?, 0, NOW(), NOW())`,
        [
          LeadId,
          `Opportunity Created: ${opportunityData.OpportunityName}`,
          `New opportunity created with estimated value of ${opportunityData.Currency} ${opportunityData.EstimatedValue}`,
          user.UserId
        ]
      );

      // Audit log
      const newOpportunity = await OpportunityModel.findById(opportunityId);
      await connection.query(
        `INSERT INTO auditlog (
          TableName, RecordId, Action, NewValues, ChangedBy, ChangedAt, IPAddress
        ) VALUES ('opportunity', ?, 'CREATE', ?, ?, NOW(), ?)`,
        [
          opportunityId,
          JSON.stringify(newOpportunity),
          user.UserId,
          '' // You can capture IP from req.ip
        ]
      );

      await connection.commit();

      logger.info('Opportunity created successfully', { opportunityId, createdBy: user.UserId });

      return newOpportunity;
    } catch (error) {
      await connection.rollback();
      logger.error('Create opportunity error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Bulk create opportunities from all qualified leads
  bulkCreateOpportunitiesFromQualifiedLeads: async (user) => {
    try {
      // Get qualified leads without opportunities
      const qualifiedLeads = await OpportunityModel.getQualifiedLeadsWithoutOpportunity(
        user.UserId,
        user.RoleId
      );

      if (qualifiedLeads.length === 0) {
        return {
          message: 'No qualified leads found without opportunities',
          created: 0,
          leads: []
        };
      }

      const results = {
        success: [],
        failed: []
      };

      // Create opportunities for each qualified lead
      for (const lead of qualifiedLeads) {
        const connection = await pool.getConnection();
        
        try {
          await connection.beginTransaction();

          // Generate opportunity name from lead data
          const opportunityName = `${lead.CompanyName || lead.CustomerName} - ${lead.Industry || 'Opportunity'}`;
          
          // Estimate value from business info budget
          const estimatedValue = lead.Budget || 0;
          const currency = lead.BudgetCurrency || 'USD';

          // Create opportunity
          const opportunityId = await OpportunityModel.create({
            LeadId: lead.LeadId,
            OpportunityName: opportunityName,
            Description: lead.RequirementSummary || 'Auto-generated opportunity from qualified lead',
            EstimatedValue: estimatedValue,
            Currency: currency,
            Probability: 30, // Default initial probability
            ExpectedCloseDate: helpers.formatDateTimeForMySQL(
              lead.Timeline
                ? helpers.parseTimelineToDate(lead.Timeline)
                : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            ),            CreatedByUserId: user.UserId,
            OpportunityStageId: 1,
            OpportunityStatusId: 1
          });

          // Update lead status to Converted
          await connection.query(
            'UPDATE leads SET LeadStatusId = ?, UpdatedBy = ?, UpdatedAt = NOW() WHERE LeadId = ?',
            [LEAD_STATUS.CONVERTED, user.UserId, lead.LeadId]
          );

          // Log activity
          await connection.query(
            `INSERT INTO activitylog (
              LeadId, ActivityTypeId, Subject, Description, Direction,
              ActivityDate, CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
            ) VALUES (?, 4, ?, ?, 'Internal', NOW(), ?, 0, NOW(), NOW())`,
            [
              lead.LeadId,
              `Opportunity Auto-Created: ${opportunityName}`,
              'Automatically created opportunity from qualified lead',
              user.UserId
            ]
          );

          // Audit log
          await connection.query(
            `INSERT INTO auditlog (
              TableName, RecordId, Action, NewValues, ChangedBy, ChangedAt
            ) VALUES ('opportunity', ?, 'BULK_CREATE', ?, ?, NOW())`,
            [
              opportunityId,
              JSON.stringify({ LeadId: lead.LeadId, OpportunityName: opportunityName }),
              user.UserId
            ]
          );

          await connection.commit();

          results.success.push({
            leadId: lead.LeadId,
            leadNumber: lead.LeadNumber,
            customerName: lead.CustomerName,
            opportunityId: opportunityId,
            opportunityName: opportunityName
          });

        } catch (error) {
          await connection.rollback();
          results.failed.push({
            leadId: lead.LeadId,
            leadNumber: lead.LeadNumber,
            customerName: lead.CustomerName,
            error: error.message
          });
          logger.error('Error creating opportunity for lead:', { leadId: lead.LeadId, error });
        } finally {
          connection.release();
        }
      }

      logger.info('Bulk opportunity creation completed', {
        total: qualifiedLeads.length,
        success: results.success.length,
        failed: results.failed.length,
        createdBy: user.UserId
      });

      return {
        message: `Bulk creation completed: ${results.success.length} opportunities created, ${results.failed.length} failed`,
        created: results.success.length,
        failed: results.failed.length,
        details: results
      };
    } catch (error) {
      logger.error('Bulk create opportunities error:', error);
      throw error;
    }
  },

  // Get all opportunities
  getAllOpportunities: async (filters, user) => {
    try {
      // Sales Person can only see opportunities for their assigned leads
      if (user.RoleId === ROLES.SALES_PERSON) {
        filters.assignedToUserId = user.UserId;
      }

      const result = await OpportunityModel.getAll(filters);

      return helpers.formatPaginationResponse(
        result.opportunities,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      logger.error('Get all opportunities error:', error);
      throw error;
    }
  },

  // Get opportunity by ID
  getOpportunityById: async (opportunityId, user) => {
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);

      if (!opportunity) {
        throw new AppError('Opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (opportunity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      return opportunity;
    } catch (error) {
      logger.error('Get opportunity by ID error:', error);
      throw error;
    }
  },

  // Update opportunity
  updateOpportunity: async (opportunityId, updateData, user) => {
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);

      if (!opportunity) {
        throw new AppError('Opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (opportunity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only update opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Check if opportunity is closed
      const isClosed = await OpportunityModel.isClosed(opportunityId);
      if (isClosed) {
        throw new AppError('Cannot update closed opportunity', HTTP_STATUS.BAD_REQUEST);
      }

      // Store old values for audit
      const oldValues = { ...opportunity };

      await OpportunityModel.update(opportunityId, updateData);

      const updatedOpportunity = await OpportunityModel.findById(opportunityId);

      // Audit log
      await AuditLogModel.create({
        TableName: 'opportunity',
        RecordId: opportunityId,
        Action: 'UPDATE',
        OldValues: JSON.stringify(oldValues),
        NewValues: JSON.stringify(updatedOpportunity),
        ChangedBy: user.UserId
      });

      logger.info('Opportunity updated successfully', { opportunityId, updatedBy: user.UserId });

      return updatedOpportunity;
    } catch (error) {
      logger.error('Update opportunity error:', error);
      throw error;
    }
  },

  // Update opportunity stage
  updateStage: async (opportunityId, newStageId, user) => {
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);

      if (!opportunity) {
        throw new AppError('Opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (opportunity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only update opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Check if opportunity is closed
      const isClosed = await OpportunityModel.isClosed(opportunityId);
      if (isClosed) {
        throw new AppError('Cannot update stage of closed opportunity', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate stage progression
      const isValid = await OpportunityStageModel.isValidProgression(
        opportunity.OpportunityStageId,
        newStageId
      );

      if (!isValid) {
        throw new AppError(
          'Invalid stage progression. Must follow pipeline sequence',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      await OpportunityModel.updateStage(opportunityId, newStageId);

      // Log activity
      const stage = await OpportunityStageModel.findById(newStageId);
      await ActivityLogModel.create({
        LeadId: opportunity.LeadId,
        ActivityTypeId: 4, // Note
        Subject: `Opportunity Stage Updated: ${stage.StageName}`,
        Description: `Opportunity moved to ${stage.StageName} stage`,
        Direction: 'Internal',
        ActivityDate: helpers.formatDateTimeForMySQL(),
        CreatedByUserId: user.UserId
      });

      // Audit log
      await AuditLogModel.create({
        TableName: 'opportunity',
        RecordId: opportunityId,
        Action: 'STAGE_UPDATE',
        OldValues: JSON.stringify({ OpportunityStageId: opportunity.OpportunityStageId }),
        NewValues: JSON.stringify({ OpportunityStageId: newStageId }),
        ChangedBy: user.UserId
      });

      const updatedOpportunity = await OpportunityModel.findById(opportunityId);

      logger.info('Opportunity stage updated', { opportunityId, newStageId, updatedBy: user.UserId });

      return updatedOpportunity;
    } catch (error) {
      logger.error('Update opportunity stage error:', error);
      throw error;
    }
  },

  // Win opportunity
  winOpportunity: async (opportunityId, winData, user) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const opportunity = await OpportunityModel.findById(opportunityId);

      if (!opportunity) {
        throw new AppError('Opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (opportunity.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only win opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      // Check if already closed
      const isClosed = await OpportunityModel.isClosed(opportunityId);
      if (isClosed) {
        throw new AppError('Opportunity is already closed', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate stage (should be in Negotiation)
      if (opportunity.OpportunityStageId !== 4) {
        throw new AppError('Opportunity must be in Negotiation stage to be marked as won', HTTP_STATUS.BAD_REQUEST);
      }

      // Mark as won
      await connection.query(
        `UPDATE opportunity 
         SET OpportunityStageId = 5, 
             OpportunityStatusId = 2,
             Probability = 100,
             ActualCloseDate = NOW(),
             UpdatedAt = NOW()
         WHERE OpportunityId = ?`,
        [opportunityId]
      );

      // Log activity
      await connection.query(
        `INSERT INTO activitylog (
          LeadId, ActivityTypeId, Subject, Description, Direction,
          Outcome, ActivityDate, CreatedByUserId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, 3, ?, ?, 'Internal', 'Won', NOW(), ?, 0, NOW(), NOW())`,
        [
          opportunity.LeadId,
          `Opportunity Won: ${opportunity.OpportunityName}`,
          `Opportunity won with value ${opportunity.Currency} ${opportunity.EstimatedValue}. ${winData.notes || ''}`,
          user.UserId
        ]
      );

      // Audit log
      await connection.query(
        `INSERT INTO auditlog (
          TableName, RecordId, Action, OldValues, NewValues, ChangedBy, ChangedAt
        ) VALUES ('opportunity', ?, 'WIN', ?, ?, ?, NOW())`,
        [
          opportunityId,
          JSON.stringify({ OpportunityStatusId: opportunity.OpportunityStatusId }),
          JSON.stringify({ OpportunityStatusId: 2, OpportunityStageId: 5 }),
          user.UserId
        ]
      );

      await connection.commit();

      const updatedOpportunity = await OpportunityModel.findById(opportunityId);

      logger.info('Opportunity marked as won', { opportunityId, wonBy: user.UserId });

      return {
        opportunity: updatedOpportunity,
        message: 'Opportunity marked as won. Ready to create sales order.',
        nextStep: 'Create Sales Order'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Win opportunity error:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Lose opportunity (handled by lostOpportunityService - see below)
  
  // Delete opportunity
  deleteOpportunity: async (opportunityId, user) => {
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);

      if (!opportunity) {
        throw new AppError('Opportunity not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        throw new AppError('Sales persons cannot delete opportunities', HTTP_STATUS.FORBIDDEN);
      }

      await OpportunityModel.delete(opportunityId);

      // Audit log
      await AuditLogModel.create({
        TableName: 'opportunity',
        RecordId: opportunityId,
        Action: 'DELETE',
        OldValues: JSON.stringify(opportunity),
        NewValues: null,
        ChangedBy: user.UserId
      });

      logger.info('Opportunity deleted', { opportunityId, deletedBy: user.UserId });

      return true;
    } catch (error) {
      logger.error('Delete opportunity error:', error);
      throw error;
    }
  },

  // Get opportunities by lead
  getOpportunitiesByLead: async (leadId, user) => {
    try {
      const lead = await LeadModel.findById(leadId);

      if (!lead) {
        throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
      }

      // In-memory ownership check
      if (user.RoleId === ROLES.SALES_PERSON) {
        if (lead.AssignedToUserId !== user.UserId) {
          throw new AppError('You can only access opportunities for leads assigned to you', HTTP_STATUS.FORBIDDEN);
        }
      }

      const opportunities = await OpportunityModel.getByLeadId(leadId);

      return opportunities;
    } catch (error) {
      logger.error('Get opportunities by lead error:', error);
      throw error;
    }
  },

  // Get pipeline view
  getPipeline: async (user) => {
    try {
      const pipeline = await OpportunityModel.getPipeline(user.UserId, user.RoleId);

      // Calculate totals
      const totals = pipeline.reduce((acc, stage) => {
        acc.totalOpportunities += stage.OpportunityCount;
        acc.totalValue += parseFloat(stage.TotalValue);
        acc.weightedValue += parseFloat(stage.WeightedValue);
        return acc;
      }, { totalOpportunities: 0, totalValue: 0, weightedValue: 0 });

      return {
        stages: pipeline,
        totals
      };
    } catch (error) {
      logger.error('Get pipeline error:', error);
      throw error;
    }
  },

  // Get forecast
  getForecast: async (user) => {
    try {
      const forecast = await OpportunityModel.getForecast(user.UserId, user.RoleId);

      return forecast;
    } catch (error) {
      logger.error('Get forecast error:', error);
      throw error;
    }
  },

  // Get opportunity stages
  getOpportunityStages: async () => {
    try {
      return await OpportunityStageModel.getAll();
    } catch (error) {
      logger.error('Get opportunity stages error:', error);
      throw error;
    }
  },

  // Get opportunity statuses
  getOpportunityStatuses: async () => {
    try {
      return await OpportunityStatusModel.getAll();
    } catch (error) {
      logger.error('Get opportunity statuses error:', error);
      throw error;
    }
  },

  // Get qualified leads without opportunities (for bulk creation preview)
  getQualifiedLeadsWithoutOpportunity: async (user) => {
    try {
      const leads = await OpportunityModel.getQualifiedLeadsWithoutOpportunity(
        user.UserId,
        user.RoleId
      );

      return leads;
    } catch (error) {
      logger.error('Get qualified leads without opportunity error:', error);
      throw error;
    }
  },

  // Generate opportunity report
  generateOpportunityReport: async (filters, user) => {
    try {
      const { startDate, endDate, stageId, statusId } = filters;

      let query = `
        SELECT 
          o.OpportunityId,
          o.OpportunityNumber,
          o.OpportunityName,
          o.EstimatedValue,
          o.Currency,
          o.Probability,
          o.ExpectedCloseDate,
          o.ActualCloseDate,
          o.CreatedAt,
          os.StageName,
          ost.StatusName,
          l.CustomerName,
          l.CompanyName,
          l.Industry,
          u.Name as CreatedBy,
          DATEDIFF(
            COALESCE(o.ActualCloseDate, NOW()), 
            o.CreatedAt
          ) as DaysInPipeline
        FROM opportunity o
        LEFT JOIN opportunitystage os ON o.OpportunityStageId = os.OpportunityStageId
        LEFT JOIN opportunitystatus ost ON o.OpportunityStatusId = ost.OpportunityStatusId
        LEFT JOIN leads l ON o.LeadId = l.LeadId
        LEFT JOIN users u ON o.CreatedByUserId = u.UserId
        WHERE o.IsDeleted = 0
      `;

      const params = [];

      // Sales Person filter
      if (user.RoleId === ROLES.SALES_PERSON) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(user.UserId);
      }

      if (startDate) {
        query += ' AND o.CreatedAt >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND o.CreatedAt <= ?';
        params.push(endDate);
      }

      if (stageId) {
        query += ' AND o.OpportunityStageId = ?';
        params.push(stageId);
      }

      if (statusId) {
        query += ' AND o.OpportunityStatusId = ?';
        params.push(statusId);
      }

      query += ' ORDER BY o.CreatedAt DESC';

      const [opportunities] = await pool.query(query, params);

      // Calculate summary statistics
      const summary = {
        totalOpportunities: opportunities.length,
        totalValue: opportunities.reduce((sum, opp) => sum + parseFloat(opp.EstimatedValue || 0), 0),
        weightedValue: opportunities.reduce((sum, opp) => sum + (parseFloat(opp.EstimatedValue || 0) * opp.Probability / 100), 0),
        avgDaysInPipeline: opportunities.reduce((sum, opp) => sum + opp.DaysInPipeline, 0) / opportunities.length || 0,
        wonCount: opportunities.filter(o => o.StatusName === 'Won').length,
        lostCount: opportunities.filter(o => o.StatusName === 'Lost').length,
        activeCount: opportunities.filter(o => o.StatusName === 'Active').length,
        winRate: 0
      };

      const closedCount = summary.wonCount + summary.lostCount;
      if (closedCount > 0) {
        summary.winRate = ((summary.wonCount / closedCount) * 100).toFixed(2);
      }

      // Group by stage
      const byStage = opportunities.reduce((acc, opp) => {
        const stage = opp.StageName;
        if (!acc[stage]) {
          acc[stage] = {
            count: 0,
            totalValue: 0,
            weightedValue: 0
          };
        }
        acc[stage].count++;
        acc[stage].totalValue += parseFloat(opp.EstimatedValue || 0);
        acc[stage].weightedValue += (parseFloat(opp.EstimatedValue || 0) * opp.Probability / 100);
        return acc;
      }, {});

      logger.info('Opportunity report generated', { user: user.UserId, count: opportunities.length });

      return {
        summary,
        byStage,
        opportunities,
        generatedAt: new Date(),
        generatedBy: user.Name
      };
    } catch (error) {
      logger.error('Generate opportunity report error:', error);
      throw error;
    }
  }
};

module.exports = OpportunityService;