const { pool } = require('../config/database');

class DealStageModel {
  static async findAll() {
    const query = `SELECT * FROM dealstage WHERE IsActive = 1 ORDER BY DisplayOrder`;
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async findById(id) {
    const query = `SELECT * FROM dealstage WHERE DealStageId = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async create(data) {
    const { StageName, Probability, DisplayOrder, Description } = data;
    const query = `INSERT INTO dealstage (StageName, Probability, DisplayOrder, Description) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.execute(query, [StageName, Probability || 0, DisplayOrder || 0, Description || null]);
    return result.insertId;
  }

  static async update(id, data) {
    const fields = Object.keys(data);
    if (fields.length === 0) return 0;
    const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
    const values = [...Object.values(data), id];
    const query = `UPDATE dealstage SET ${setClause} WHERE DealStageId = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows;
  }

  static async delete(id) {
    const query = `UPDATE dealstage SET IsActive = 0 WHERE DealStageId = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows;
  }
}

module.exports = DealStageModel;
