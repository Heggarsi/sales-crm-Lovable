const { pool } = require('../config/database');

class AccountModel {
  static async create(accountData) {
    const {
      AccountNumber, AccountName, Phone, Website, Industry,
      AnnualRevenue, NumberOfEmployees, BillingStreet, BillingCity,
      BillingState, BillingCountry, BillingZip, ShippingStreet,
      ShippingCity, ShippingState, ShippingCountry, ShippingZip,
      Description, CreatedBy
    } = accountData;

    const query = `
      INSERT INTO accounts (
        AccountNumber, AccountName, Phone, Website, Industry,
        AnnualRevenue, NumberOfEmployees, BillingStreet, BillingCity,
        BillingState, BillingCountry, BillingZip, ShippingStreet,
        ShippingCity, ShippingState, ShippingCountry, ShippingZip,
        Description, CreatedBy, UpdatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      AccountNumber, AccountName, Phone || null, Website || null, Industry || null,
      AnnualRevenue || null, NumberOfEmployees || null, BillingStreet || null, BillingCity || null,
      BillingState || null, BillingCountry || null, BillingZip || null, ShippingStreet || null,
      ShippingCity || null, ShippingState || null, ShippingCountry || null, ShippingZip || null,
      Description || null, CreatedBy, CreatedBy
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  static async findAll(filters = {}, user = null) {
    const {
      page = 1,
      limit = 10,
      AccountName,
      Industry
    } = filters;

    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, u.Name as CreatorName 
      FROM accounts a
      LEFT JOIN users u ON a.CreatedBy = u.UserId
      WHERE a.IsDeleted = 0
    `;
    const values = [];

    if (AccountName) {
      query += ` AND a.AccountName LIKE ?`;
      values.push(`%${AccountName}%`);
    }

    if (Industry) {
      query += ` AND a.Industry LIKE ?`;
      values.push(`%${Industry}%`);
    }

    // Role-based filtering can be added here if needed

    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const [countResult] = await pool.query(countQuery, values);
    const total = countResult[0].total;

    query += ` ORDER BY a.CreatedAt DESC LIMIT ? OFFSET ?`;
    values.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, values);
    
    return {
      accounts: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    };
  }

  static async findById(id) {
    const query = `
      SELECT a.*, u.Name as CreatorName, u2.Name as UpdaterName
      FROM accounts a
      LEFT JOIN users u ON a.CreatedBy = u.UserId
      LEFT JOIN users u2 ON a.UpdatedBy = u2.UserId
      WHERE a.AccountId = ? AND a.IsDeleted = 0
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async update(id, accountData) {
    const fields = Object.keys(accountData);
    if (fields.length === 0) return 0;

    const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
    const values = [...Object.values(accountData), id];

    const query = `UPDATE accounts SET ${setClause} WHERE AccountId = ? AND IsDeleted = 0`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows;
  }

  static async delete(id, userId) {
    const query = `UPDATE accounts SET IsDeleted = 1, UpdatedBy = ? WHERE AccountId = ?`;
    const [result] = await pool.execute(query, [userId, id]);
    return result.affectedRows;
  }

  static async getNextAccountNumber() {
    const query = `SELECT MAX(AccountId) as maxId FROM accounts`;
    const [rows] = await pool.execute(query);
    const nextId = (rows[0].maxId || 0) + 1;
    return `ACC-${nextId.toString().padStart(5, '0')}`;
  }

  static async findByName(name) {
    const query = `SELECT AccountId FROM accounts WHERE AccountName = ? AND IsDeleted = 0 LIMIT 1`;
    const [rows] = await pool.execute(query, [name]);
    return rows[0] || null;
  }
}

module.exports = AccountModel;
