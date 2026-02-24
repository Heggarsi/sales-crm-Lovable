const { pool } = require('../config/database');
const logger = require('../utils/logger');

const AuditLogModel = {
  // Create audit log entry
  create: async (auditData) => {
    try {
      const {
        TableName,
        RecordId,
        Action,
        OldValues,
        NewValues,
        ChangedBy,
        IPAddress,
        UserAgent
      } = auditData;

      const [result] = await pool.query(
        `INSERT INTO auditlog (
          TableName, RecordId, Action, OldValues, NewValues,
          ChangedBy, ChangedAt, IPAddress, UserAgent
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [
          TableName,
          RecordId,
          Action,
          OldValues,
          NewValues,
          ChangedBy,
          IPAddress || null,
          UserAgent || null
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }
  },

  // Get audit logs by table and record
  getByRecord: async (tableName, recordId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          al.*,
          u.Name as ChangedByName
         FROM auditlog al
         LEFT JOIN users u ON al.ChangedBy = u.UserId
         WHERE al.TableName = ? AND al.RecordId = ?
         ORDER BY al.ChangedAt DESC`,
        [tableName, recordId]
      );

      // Parse JSON fields
      rows.forEach(row => {
        if (row.OldValues) {
          try {
            row.OldValues = JSON.parse(row.OldValues);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
        if (row.NewValues) {
          try {
            row.NewValues = JSON.parse(row.NewValues);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
      });

      return rows;
    } catch (error) {
      logger.error('Error getting audit logs by record:', error);
      throw error;
    }
  },

  // Get all audit logs with filters
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        tableName,
        recordId,
        action,
        changedBy,
        fromDate,
        toDate
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          al.*,
          u.Name as ChangedByName
        FROM auditlog al
        LEFT JOIN users u ON al.ChangedBy = u.UserId
        WHERE 1=1
      `;

      const params = [];

      if (tableName) {
        query += ' AND al.TableName = ?';
        params.push(tableName);
      }

      if (recordId) {
        query += ' AND al.RecordId = ?';
        params.push(recordId);
      }

      if (action) {
        query += ' AND al.Action = ?';
        params.push(action);
      }

      if (changedBy) {
        query += ' AND al.ChangedBy = ?';
        params.push(changedBy);
      }

      if (fromDate) {
        query += ' AND al.ChangedAt >= ?';
        params.push(fromDate);
      }

      if (toDate) {
        query += ' AND al.ChangedAt <= ?';
        params.push(toDate);
      }

      // Get total count
      const countQuery = query.replace(
        /SELECT[\s\S]*FROM/,
        'SELECT COUNT(*) as total FROM'
      );
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated results
      query += ' ORDER BY al.ChangedAt DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      // Parse JSON fields
      rows.forEach(row => {
        if (row.OldValues) {
          try {
            row.OldValues = JSON.parse(row.OldValues);
          } catch (e) {
            // Keep as string
          }
        }
        if (row.NewValues) {
          try {
            row.NewValues = JSON.parse(row.NewValues);
          } catch (e) {
            // Keep as string
          }
        }
      });

      return {
        audits: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all audit logs:', error);
      throw error;
    }
  }
};

module.exports = AuditLogModel;