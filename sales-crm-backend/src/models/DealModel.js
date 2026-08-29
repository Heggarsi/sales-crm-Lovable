const { pool } = require('../config/database');

const DEAL_STAGE_NAMES = {
  VALUE_PROPOSITION: ['Value Proposition'],
  PROPOSAL: ['Proposal / Price Quote', 'Proposal'],
  NEGOTIATION: ['Negotiation / Review', 'Negotiation'],
  CLOSED_WON: ['Closed Won'],
  CLOSED_LOST: ['Closed Lost']
};

class DealModel {
  static async create(dealData) {
    const {
      DealNumber, DealName, DealStageId, ClosingDate, AccountId,
      ContactId, Amount, Probability, DealType, LeadSource,
      ExpectedRevenue, Description, AssignedToUserId, CreatedBy
    } = dealData;

    const query = `
      INSERT INTO deals (
        DealNumber, DealName, DealStageId, ClosingDate, AccountId,
        ContactId, Amount, Probability, DealType, LeadSource,
        ExpectedRevenue, Description, AssignedToUserId, CreatedBy, UpdatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      DealNumber, DealName, DealStageId, ClosingDate, AccountId || null,
      ContactId || null, Amount || null, Probability || null, DealType || null, LeadSource || null,
      ExpectedRevenue || null, Description || null, AssignedToUserId || null, CreatedBy, CreatedBy
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      DealName,
      DealStageId,
      AssignedToUserId,
      search
    } = filters;

    const offset = (page - 1) * limit;

    let query = `
      SELECT d.*, ds.StageName, ds.Probability as StageProbability, 
             a.AccountName, c.FirstName as ContactFirstName, c.LastName as ContactLastName,
             u.Name as AssignedToName, uc.Name as CreatorName
      FROM deals d
      LEFT JOIN dealstage ds ON d.DealStageId = ds.DealStageId
      LEFT JOIN accounts a ON d.AccountId = a.AccountId
      LEFT JOIN contacts c ON d.ContactId = c.ContactId
      LEFT JOIN users u ON d.AssignedToUserId = u.UserId
      LEFT JOIN users uc ON d.CreatedBy = uc.UserId
      WHERE d.IsDeleted = 0
    `;
    const values = [];

    if (DealName) {
      query += ` AND d.DealName LIKE ?`;
      values.push(`%${DealName}%`);
    }

    if (DealStageId) {
      query += ` AND d.DealStageId = ?`;
      values.push(DealStageId);
    }

    if (AssignedToUserId) {
      query += ` AND d.AssignedToUserId = ?`;
      values.push(AssignedToUserId);
    }

    if (search) {
      query += ` AND (d.DealName LIKE ? OR d.DealNumber LIKE ?)`;
      const s = `%${search}%`;
      values.push(s, s);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const [countResult] = await pool.query(countQuery, values);
    const total = countResult[0].total;

    query += ` ORDER BY d.CreatedAt DESC LIMIT ? OFFSET ?`;
    values.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, values);
    
    return {
      deals: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    };
  }

  static async findById(id) {
    const query = `
      SELECT d.*, ds.StageName, ds.Probability as StageProbability,
             a.AccountName, c.FirstName as ContactFirstName, c.LastName as ContactLastName,
             u.Name as AssignedToName, uc.Name as CreatorName, uu.Name as UpdaterName
      FROM deals d
      LEFT JOIN dealstage ds ON d.DealStageId = ds.DealStageId
      LEFT JOIN accounts a ON d.AccountId = a.AccountId
      LEFT JOIN contacts c ON d.ContactId = c.ContactId
      LEFT JOIN users u ON d.AssignedToUserId = u.UserId
      LEFT JOIN users uc ON d.CreatedBy = uc.UserId
      LEFT JOIN users uu ON d.UpdatedBy = uu.UserId
      WHERE d.DealId = ? AND d.IsDeleted = 0
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async update(id, dealData) {
    const fields = Object.keys(dealData);
    if (fields.length === 0) return 0;

    const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
    const values = [...Object.values(dealData), id];

    const query = `UPDATE deals SET ${setClause} WHERE DealId = ? AND IsDeleted = 0`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows;
  }

  static async findStageByNames(stageNames, connection = null) {
    const db = connection || pool;
    const placeholders = stageNames.map(() => '?').join(', ');
    const [rows] = await db.query(
      `SELECT DealStageId, StageName, Probability, DisplayOrder
       FROM dealstage
       WHERE StageName IN (${placeholders}) AND IsActive = 1
       ORDER BY FIELD(StageName, ${placeholders})
       LIMIT 1`,
      [...stageNames, ...stageNames]
    );
    return rows[0] || null;
  }

  static async updateStageIfForward(dealId, stageNames, updatedBy = null, connection = null) {
    const db = connection || pool;
    const [rows] = await db.query(
      `SELECT d.DealStageId, ds.DisplayOrder
       FROM deals d
       LEFT JOIN dealstage ds ON d.DealStageId = ds.DealStageId
       WHERE d.DealId = ? AND d.IsDeleted = 0`,
      [dealId]
    );

    const deal = rows[0];
    if (!deal) return false;

    const targetStage = await DealModel.findStageByNames(stageNames, db);
    if (!targetStage) return false;

    if ((deal.DisplayOrder || 0) > (targetStage.DisplayOrder || 0)) {
      return false;
    }

    const params = [targetStage.DealStageId];
    let query = 'UPDATE deals SET DealStageId = ?, UpdatedAt = NOW()';

    if (updatedBy) {
      query += ', UpdatedBy = ?';
      params.push(updatedBy);
    }

    query += ' WHERE DealId = ? AND IsDeleted = 0';
    params.push(dealId);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }

  static async updateStageByName(dealId, stageNames, updatedBy = null, connection = null) {
    const db = connection || pool;
    const targetStage = await DealModel.findStageByNames(stageNames, db);
    if (!targetStage) return false;

    const params = [targetStage.DealStageId];
    let query = 'UPDATE deals SET DealStageId = ?, UpdatedAt = NOW()';

    if (updatedBy) {
      query += ', UpdatedBy = ?';
      params.push(updatedBy);
    }

    query += ' WHERE DealId = ? AND IsDeleted = 0';
    params.push(dealId);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }

  static async moveToProposalStage(dealId, updatedBy = null, connection = null) {
    return DealModel.updateStageIfForward(dealId, DEAL_STAGE_NAMES.PROPOSAL, updatedBy, connection);
  }

  static async moveToNegotiationStage(dealId, updatedBy = null, connection = null) {
    return DealModel.updateStageIfForward(dealId, DEAL_STAGE_NAMES.NEGOTIATION, updatedBy, connection);
  }

  static async moveToClosedWonStage(dealId, updatedBy = null, connection = null) {
    return DealModel.updateStageByName(dealId, DEAL_STAGE_NAMES.CLOSED_WON, updatedBy, connection);
  }

  static async moveToClosedLostStage(dealId, updatedBy = null, connection = null) {
    return DealModel.updateStageByName(dealId, DEAL_STAGE_NAMES.CLOSED_LOST, updatedBy, connection);
  }
  static async moveToProposalStageForRevision(dealId, updatedBy = null, connection = null) {
    return DealModel.updateStageByName(
      dealId,
      DEAL_STAGE_NAMES.PROPOSAL,
      updatedBy,
      connection
    );
  }

  static async delete(id, userId) {
    const query = `UPDATE deals SET IsDeleted = 1, UpdatedBy = ? WHERE DealId = ?`;
    const [result] = await pool.execute(query, [userId, id]);
    return result.affectedRows;
  }

  static async getNextDealNumber() {
    const query = `SELECT MAX(DealId) as maxId FROM deals`;
    const [rows] = await pool.execute(query);
    const nextId = (rows[0].maxId || 0) + 1;
    return `DEAL-${nextId.toString().padStart(5, '0')}`;
  }

  
}

module.exports = DealModel;
