const { pool } = require('../config/database');

class ContactModel {
  static async create(contactData) {
    const {
      ContactNumber, FirstName, LastName, Email, Phone, Mobile,
      Department, Title, AccountId, LeadSource, MailingStreet,
      MailingCity, MailingState, MailingCountry, MailingZip,
      Description, CreatedBy
    } = contactData;

    const query = `
      INSERT INTO contacts (
        ContactNumber, FirstName, LastName, Email, Phone, Mobile,
        Department, Title, AccountId, LeadSource, MailingStreet,
        MailingCity, MailingState, MailingCountry, MailingZip,
        Description, CreatedBy, UpdatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      ContactNumber, FirstName || null, LastName, Email || null, Phone || null, Mobile || null,
      Department || null, Title || null, AccountId || null, LeadSource || null, MailingStreet || null,
      MailingCity || null, MailingState || null, MailingCountry || null, MailingZip || null,
      Description || null, CreatedBy, CreatedBy
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      FirstName,
      LastName,
      Email,
      AccountId,
      search
    } = filters;

    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, a.AccountName, u.Name as CreatorName
      FROM contacts c
      LEFT JOIN accounts a ON c.AccountId = a.AccountId
      LEFT JOIN users u ON c.CreatedBy = u.UserId
      WHERE c.IsDeleted = 0
    `;
    const values = [];

    if (FirstName) {
      query += ` AND c.FirstName LIKE ?`;
      values.push(`%${FirstName}%`);
    }

    if (LastName) {
      query += ` AND c.LastName LIKE ?`;
      values.push(`%${LastName}%`);
    }

    if (AccountId) {
      query += ` AND c.AccountId = ?`;
      values.push(AccountId);
    }

    if (Email) {
      query += ` AND c.Email LIKE ?`;
      values.push(`%${Email}%`);
    }

    if (search) {
      query += ` AND (c.FirstName LIKE ? OR c.LastName LIKE ? OR c.Email LIKE ? OR c.Phone LIKE ?)`;
      const s = `%${search}%`;
      values.push(s, s, s, s);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const [countResult] = await pool.query(countQuery, values);
    const total = countResult[0].total;

    query += ` ORDER BY c.CreatedAt DESC LIMIT ? OFFSET ?`;
    values.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, values);
    
    return {
      contacts: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    };
  }

  static async findById(id) {
    const query = `
      SELECT c.*, a.AccountName, u.Name as CreatorName, u2.Name as UpdaterName
      FROM contacts c
      LEFT JOIN accounts a ON c.AccountId = a.AccountId
      LEFT JOIN users u ON c.CreatedBy = u.UserId
      LEFT JOIN users u2 ON c.UpdatedBy = u2.UserId
      WHERE c.ContactId = ? AND c.IsDeleted = 0
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async update(id, contactData) {
    const fields = Object.keys(contactData);
    if (fields.length === 0) return 0;

    const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
    const values = [...Object.values(contactData), id];

    const query = `UPDATE contacts SET ${setClause} WHERE ContactId = ? AND IsDeleted = 0`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows;
  }

  static async delete(id, userId) {
    const query = `UPDATE contacts SET IsDeleted = 1, UpdatedBy = ? WHERE ContactId = ?`;
    const [result] = await pool.execute(query, [userId, id]);
    return result.affectedRows;
  }

  static async getNextContactNumber() {
    const query = `SELECT MAX(ContactId) as maxId FROM contacts`;
    const [rows] = await pool.execute(query);
    const nextId = (rows[0].maxId || 0) + 1;
    return `CON-${nextId.toString().padStart(5, '0')}`;
  }
}

module.exports = ContactModel;
