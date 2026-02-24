const { pool } = require('../config/database');
const logger = require('../utils/logger');

const OpportunityStageModel = {
  // Get all opportunity stages
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM opportunitystage ORDER BY OpportunityStageId'
      );
      return rows;
    } catch (error) {
      logger.error('Error getting opportunity stages:', error);
      throw error;
    }
  },

  // Get opportunity stage by ID
  findById: async (stageId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM opportunitystage WHERE OpportunityStageId = ?',
        [stageId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding opportunity stage by ID:', error);
      throw error;
    }
  },

  // Validate stage progression
  isValidProgression: async (currentStageId, newStageId) => {
    try {
      // Allowed progressions
      const allowedProgressions = {
        1: [2],           // Prospecting → Qualification
        2: [1, 3],        // Qualification → Prospecting or Proposal
        3: [2, 4],        // Proposal → Qualification or Negotiation
        4: [3, 5, 6],     // Negotiation → Proposal, Won, or Lost
        5: [],            // Closed Won (final)
        6: []             // Closed Lost (final)
      };

      const allowed = allowedProgressions[currentStageId] || [];
      return allowed.includes(newStageId);
    } catch (error) {
      logger.error('Error validating stage progression:', error);
      throw error;
    }
  }
};

module.exports = OpportunityStageModel;