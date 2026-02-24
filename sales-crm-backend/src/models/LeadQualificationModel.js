const { pool } = require('../config/database');
const logger = require('../utils/logger');

const LeadQualificationModel = {
  // Create qualification
  
  create: async (qualificationData) => {
    try {
      const {
        LeadId,
        Budget,
        BudgetCurrency,
        RequirementSummary,
        PainPoints,
        DecisionTimeframe,
        CompetitorAnalysis,
        QualifiedByUserId,
        QualificationStatusId
      } = qualificationData;

      const [result] = await pool.query(
        `INSERT INTO leadqualification (
          LeadId, Budget, BudgetCurrency, RequirementSummary, PainPoints,
          DecisionTimeframe, CompetitorAnalysis, QualifiedByUserId, QualifiedAt,
          QualificationStatusId, IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 0, NOW(), NOW())`,
        [
          LeadId, Budget, BudgetCurrency, RequirementSummary, PainPoints,
          DecisionTimeframe, CompetitorAnalysis, QualifiedByUserId,
          QualificationStatusId
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating lead qualification:', error);
      throw error;
    }
  },

  // Find by lead ID
  findByLeadId: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT lq.*, qs.StatusName as QualificationStatusName, u.Name as QualifiedByUserName
         FROM leadqualification lq
         LEFT JOIN qualificationstatus qs ON lq.QualificationStatusId = qs.QualificationStatusId
         LEFT JOIN users u ON lq.QualifiedByUserId = u.UserId
         WHERE lq.LeadId = ? AND lq.IsDeleted = 0
         ORDER BY lq.QualifiedAt DESC
         LIMIT 1`,
        [leadId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead qualification:', error);
      throw error;
    }
  },

  // Update qualification
  update: async (qualificationId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'Budget', 'BudgetCurrency', 'RequirementSummary', 'PainPoints',
        'DecisionTimeframe', 'CompetitorAnalysis', 'QualificationStatusId'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      });

      if (fields.length === 0) {
        return false;
      }

      fields.push('UpdatedAt = NOW()');
      params.push(qualificationId);

      const [result] = await pool.query(
        `UPDATE leadqualification SET ${fields.join(', ')} WHERE QualificationId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lead qualification:', error);
      throw error;
    }
  }
};

module.exports = LeadQualificationModel;