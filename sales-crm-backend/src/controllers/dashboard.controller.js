const { pool } = require('../config/database');
const { LEAD_STATUS, DEAL_STAGE } = require('../config/constants');

/**
 * Get dashboard statistics
 * @param {Object} req 
 * @param {Object} res 
 */
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper to format date for MySQL
    const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

    const currentRange = [formatDate(firstDayCurrentMonth), formatDate(lastDayCurrentMonth)];
    const lastRange = [formatDate(firstDayLastMonth), formatDate(lastDayLastMonth)];

    // 1. KPI Queries
    const kpiQueries = {
      totalLeads: `SELECT COUNT(*) as count FROM leads WHERE IsDeleted = 0 AND CreatedAt BETWEEN ? AND ?`,
      qualifiedLeads: `SELECT COUNT(*) as count FROM leads WHERE IsDeleted = 0 AND LeadStatusId = ${LEAD_STATUS.QUALIFIED} AND CreatedAt BETWEEN ? AND ?`,
      opportunities: `SELECT COUNT(*) as count FROM deals WHERE IsDeleted = 0 AND DealStageId IN (${DEAL_STAGE.QUALIFICATION}, ${DEAL_STAGE.NEEDS_ANALYSIS}, ${DEAL_STAGE.VALUE_PROPOSITION}, ${DEAL_STAGE.PROPOSAL_QUOTE}, ${DEAL_STAGE.NEGOTIATION_REVIEW}) AND CreatedAt BETWEEN ? AND ?`,
      proposals: `SELECT COUNT(*) as count FROM proposal WHERE IsDeleted = 0 AND CreatedAt BETWEEN ? AND ?`,
      revenue: `SELECT SUM(Amount) as amount FROM deals WHERE IsDeleted = 0 AND DealStageId = ${DEAL_STAGE.CLOSED_WON} AND ClosingDate BETWEEN ? AND ?`,
      wonDeals: `SELECT COUNT(*) as count FROM deals WHERE IsDeleted = 0 AND DealStageId = ${DEAL_STAGE.CLOSED_WON} AND ClosingDate BETWEEN ? AND ?`,
      lostDeals: `SELECT COUNT(*) as count FROM deals WHERE IsDeleted = 0 AND DealStageId = ${DEAL_STAGE.CLOSED_LOST} AND ClosingDate BETWEEN ? AND ?`
    };

    const stats = {};

    for (const [key, query] of Object.entries(kpiQueries)) {
      const [current] = await pool.query(query, currentRange);
      const [last] = await pool.query(query, lastRange);

      const currentVal = Number(current[0].count || current[0].amount || 0);
      const lastVal = Number(last[0].count || last[0].amount || 0);

      let change = 0;
      if (lastVal > 0) {
        change = ((currentVal - lastVal) / lastVal) * 100;
      } else if (currentVal > 0) {
        change = 100;
      }

      stats[key] = {
        value: currentVal,
        change: parseFloat(change.toFixed(1)),
        lastMonth: lastVal
      };
    }

    // Conversion Rate calculation
    const currentWon = stats.wonDeals.value;
    const currentLost = stats.lostDeals.value;
    const currentTotalClosed = currentWon + currentLost;
    const currentConvRate = currentTotalClosed > 0 ? (currentWon / currentTotalClosed) * 100 : 0;

    const lastWon = stats.wonDeals.lastMonth;
    const lastLost = stats.lostDeals.lastMonth;
    const lastTotalClosed = lastWon + lastLost;
    const lastConvRate = lastTotalClosed > 0 ? (lastWon / lastTotalClosed) * 100 : 0;

    let convChange = 0;
    if (lastConvRate > 0) {
      convChange = ((currentConvRate - lastConvRate) / lastConvRate) * 100;
    } else if (currentConvRate > 0) {
      convChange = 100;
    }

    stats.conversionRate = {
      value: parseFloat(currentConvRate.toFixed(1)),
      change: parseFloat(convChange.toFixed(1))
    };

    // 2. Sales Pipeline
    const [pipelineData] = await pool.query(`
      SELECT ds.StageName as name, COUNT(d.DealId) as value
      FROM dealstage ds
      LEFT JOIN deals d ON ds.DealStageId = d.DealStageId AND d.IsDeleted = 0
      WHERE ds.IsActive = 1
      GROUP BY ds.DealStageId, ds.StageName, ds.DisplayOrder
      ORDER BY ds.DisplayOrder
    `);

    // 3. Lead Performance (Monthly for the last 6 months)
    const [leadPerformance] = await pool.query(`
      SELECT 
        DATE_FORMAT(CreatedAt, '%b') as name,
        COUNT(*) as leads,
        SUM(CASE WHEN LeadStatusId = ${LEAD_STATUS.QUALIFIED} THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN IsConverted = 1 THEN 1 ELSE 0 END) as converted
      FROM leads
      WHERE IsDeleted = 0 
        AND CreatedAt >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(CreatedAt, '%b'), YEAR(CreatedAt), MONTH(CreatedAt)
      ORDER BY YEAR(CreatedAt), MONTH(CreatedAt)
    `);

    // 4. Top Performers
    const [topPerformers] = await pool.query(`
      SELECT u.Name as name, SUM(d.Amount) as revenue, COUNT(d.DealId) as wonDeals
      FROM deals d
      JOIN users u ON d.AssignedToUserId = u.UserId
      WHERE d.IsDeleted = 0 AND d.DealStageId = ${DEAL_STAGE.CLOSED_WON}
      GROUP BY u.UserId, u.Name
      ORDER BY revenue DESC
      LIMIT 5
    `);

    // 5. Recent Closed Deals
    const [recentClosedDeals] = await pool.query(`
      SELECT d.DealId, d.DealName as name, d.Amount as amount, ds.StageName as status, 
             u.Name as owner, d.ClosingDate as date
      FROM deals d
      JOIN dealstage ds ON d.DealStageId = ds.DealStageId
      LEFT JOIN users u ON d.AssignedToUserId = u.UserId
      WHERE d.IsDeleted = 0 AND d.DealStageId IN (${DEAL_STAGE.CLOSED_WON}, ${DEAL_STAGE.CLOSED_LOST})
      ORDER BY d.UpdatedAt DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: {
        kpis: stats,
        pipeline: pipelineData,
        leadPerformance: leadPerformance,
        topPerformers,
        recentClosedDeals
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats
};
