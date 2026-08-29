const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const UserModel = {
  // Find user by email
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          u.*,
          r.RoleName
         FROM users u
         LEFT JOIN userrole r ON u.RoleId = r.RoleId
         WHERE u.Email = ? AND u.IsDeleted = 0`,
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  },

  // Find user by ID
  findById: async (userId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          u.UserId,
          u.Name,
          u.Email,
          u.RoleId,
          u.IsActive,
          u.IsDeleted,
          u.CreatedAt,
          u.UpdatedAt,
          r.RoleName
         FROM users u
         LEFT JOIN userrole r ON u.RoleId = r.RoleId
         WHERE u.UserId = ? AND u.IsDeleted = 0`,
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const { Name, Email, Password, RoleId, CreatedBy } = userData;

      // Hash password
      const hashedPassword = await bcrypt.hash(Password, 10);

      const [result] = await pool.query(
        `INSERT INTO users (Name, Email, Password, RoleId, IsActive, IsDeleted, CreatedBy, CreatedAt, UpdatedAt)
         VALUES (?, ?, ?, ?, 1, 0, ?, NOW(), NOW())`,
        [Name, Email, hashedPassword, RoleId, CreatedBy || null]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  },

  // Get all users with pagination
  getAll: async (filters = {}) => {
    try {
      const { page = 1, limit = 10, roleId, isActive, search } = filters;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          u.UserId,
          u.Name,
          u.Email,
          u.RoleId,
          u.IsActive,
          u.CreatedAt,
          r.RoleName
        FROM users u
        LEFT JOIN userrole r ON u.RoleId = r.RoleId
        WHERE u.IsDeleted = 0
      `;

      const params = [];

      if (roleId) {
        query += ' AND u.RoleId = ?';
        params.push(roleId);
      }

      if (isActive !== undefined) {
        query += ' AND u.IsActive = ?';
        params.push(isActive);
      }

      if (search) {
        query += ' AND (u.Name LIKE ? OR u.Email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Get total count
      const countQuery = query.replace('SELECT u.UserId, u.Name, u.Email, u.RoleId, u.IsActive, u.CreatedAt, r.RoleName', 'SELECT COUNT(*) as total');
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated results
      query += ' ORDER BY u.CreatedAt DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        users: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  },

  // Update user
  update: async (userId, updateData) => {
    try {
      const { Name, Email, RoleId, IsActive, UpdatedBy } = updateData;

      const fields = [];
      const params = [];

      if (Name) {
        fields.push('Name = ?');
        params.push(Name);
      }
      if (Email) {
        fields.push('Email = ?');
        params.push(Email);
      }
      if (RoleId) {
        fields.push('RoleId = ?');
        params.push(RoleId);
      }
      if (IsActive !== undefined) {
        fields.push('IsActive = ?');
        params.push(IsActive);
      }
      if (UpdatedBy) {
        fields.push('UpdatedBy = ?');
        params.push(UpdatedBy);
      }

      fields.push('UpdatedAt = NOW()');
      params.push(userId);

      const [result] = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE UserId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  },

  // Update password
  updatePassword: async (userId, newPassword) => {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const [result] = await pool.query(
        'UPDATE users SET Password = ?, UpdatedAt = NOW() WHERE UserId = ?',
        [hashedPassword, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating password:', error);
      throw error;
    }
  },

  // Soft delete user
  delete: async (userId, deletedBy) => {
    try {
      const [result] = await pool.query(
        'UPDATE users SET IsDeleted = 1, IsActive = 0, UpdatedBy = ?, UpdatedAt = NOW() WHERE UserId = ?',
        [deletedBy, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  },

  // Verify password
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Get users by role
  getUsersByRole: async (roleId) => {
    try {
      const [rows] = await pool.query(
        `SELECT UserId, Name, Email, RoleId, IsActive
         FROM users
         WHERE RoleId = ? AND IsActive = 1 AND IsDeleted = 0
         ORDER BY Name`,
        [roleId]
      );
      return rows;
    } catch (error) {
      logger.error('Error getting users by role:', error);
      throw error;
    }
  },

  // Check if user has Sales Person role
  isSalesPerson: async (userId) => {
    try {
      const [rows] = await pool.query(
        `SELECT r.RoleName 
         FROM users u
         JOIN userrole r ON u.RoleId = r.RoleId
         WHERE u.UserId = ? AND u.IsDeleted = 0`,
        [userId]
      );
      return rows.length > 0 && rows[0].RoleName === 'Sales Person';
    } catch (error) {
      logger.error('Error checking if user is sales person:', error);
      throw error;
    }
  }
};

module.exports = UserModel;