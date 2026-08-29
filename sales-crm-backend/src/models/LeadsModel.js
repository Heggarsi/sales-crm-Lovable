const { pool } = require('../config/database');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const { AppError } = require('../middlewares/errorHandler.middleware');

const LeadModel = {
  // Create new lead
create: async (leadData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      FirstName,
      LastName,
      Email,
      Phone,
      AlternatePhone,
      Mobile,
      CompanyName,
      Industry,
      AnnualRevenue,
      Rating,
      Designation,
      Country,
      State,
      City,
      Address,
      SourceId,
      LeadTypeId,
      AssignedToUserId,
      AssignedBy,
      LeadStatusId,
      ServiceRequiredId,
      EstimatedValue,
      Remarks,
      CreatedBy
    } = leadData;

    // 2. Generate unique lead number
    const LeadNumber = helpers.generateUniqueNumber('LEAD');

    // 3. Insert
    const [result] = await connection.query(
      `INSERT INTO leads (
        LeadNumber, FirstName, LastName, Email, Phone, AlternatePhone, Mobile,
        CompanyName, Industry, AnnualRevenue, Rating, Designation, Country, State, City, Address,
        SourceId, LeadTypeId, AssignedToUserId, AssignedBy, AssignedAt,
        LeadStatusId, ServiceRequiredId, EstimatedValue, Remarks,
        IsActive, IsDeleted, CreatedBy, CreatedAt, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, NOW(), NOW())`,
      [
        LeadNumber, FirstName || null, LastName, Email, Phone, AlternatePhone, Mobile || null,
        CompanyName, Industry, AnnualRevenue || null, Rating || null, Designation, Country, State, City, Address,
        SourceId, LeadTypeId, AssignedToUserId || null, AssignedBy || null,
        AssignedToUserId ? helpers.formatDateTimeForMySQL() : null,
        LeadStatusId || 1,
        ServiceRequiredId || null,
        EstimatedValue || null,
        Remarks || null,
        CreatedBy
      ]
    );

    await connection.commit();
    return result.insertId;

  } catch (error) {
    await connection.rollback();
    logger.error('Error creating lead:', error);
    throw error;
  } finally {
    connection.release();
  }
},


  // Find lead by email (active, not deleted)
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query(
        `SELECT LeadId, LeadNumber, FirstName, LastName, Email
         FROM leads
         WHERE Email = ? AND IsDeleted = 0`,
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead by email:', error);
      throw error;
    }
  },

  // Get lead by ID with related data
  findById: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          l.*,
          ls.SourceName,
          ls.SourceType,
          lt.TypeName as LeadTypeName,
          lt.Priority as LeadPriority,
          lst.StatusName as LeadStatusName,
          lsr.ServiceName as ServiceRequiredName,
          u.Name as AssignedToName,
          u.Email as AssignedToEmail,
          u.RoleId as AssignedToRoleId,
          creator.Name as CreatedByName,
          updater.Name as UpdatedByName
         FROM leads l
         LEFT JOIN leadsource ls ON l.SourceId = ls.SourceId
         LEFT JOIN leadtype lt ON l.LeadTypeId = lt.LeadTypeId
         LEFT JOIN leadstatus lst ON l.LeadStatusId = lst.LeadStatusId
         LEFT JOIN lead_service_required lsr ON l.ServiceRequiredId = lsr.ServiceRequiredId
         LEFT JOIN users u ON l.AssignedToUserId = u.UserId
         LEFT JOIN users creator ON l.CreatedBy = creator.UserId
         LEFT JOIN users updater ON l.UpdatedBy = updater.UserId
         WHERE l.LeadId = ? AND l.IsDeleted = 0`,
        [leadId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding lead by ID:', error);
      throw error;
    }
  },

  // Get all leads with filters
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        assignedToUserId,
        leadStatusId,
        sourceId,
        leadTypeId,
        serviceRequiredId,
        search,
        sortBy,
        sortOrder,
        createdBy
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          l.LeadId,
          l.LeadNumber,
          l.FirstName,
          l.LastName,
          l.Email,
          l.Phone,
          l.CompanyName,
          l.Industry,
          l.AssignedToUserId,
          l.LeadStatusId,
          l.ServiceRequiredId,
          l.EstimatedValue,
          l.IsConverted,
          l.CreatedAt,
          ls.SourceName,
          lt.TypeName as LeadTypeName,
          lst.StatusName as LeadStatusName,
          lsr.ServiceName as ServiceRequiredName,
          u.Name as AssignedToName
        FROM leads l
        LEFT JOIN leadsource ls ON l.SourceId = ls.SourceId
        LEFT JOIN leadtype lt ON l.LeadTypeId = lt.LeadTypeId
        LEFT JOIN leadstatus lst ON l.LeadStatusId = lst.LeadStatusId
        LEFT JOIN lead_service_required lsr ON l.ServiceRequiredId = lsr.ServiceRequiredId
        LEFT JOIN users u ON l.AssignedToUserId = u.UserId
        WHERE l.IsDeleted = 0
      `;

      const params = [];

      if (assignedToUserId) {
        query += ' AND l.AssignedToUserId = ?';
        params.push(assignedToUserId);
      }

      if (leadStatusId) {
        query += ' AND l.LeadStatusId = ?';
        params.push(leadStatusId);
      }

      if (sourceId) {
        query += ' AND l.SourceId = ?';
        params.push(sourceId);
      }

      if (leadTypeId) {
        query += ' AND l.LeadTypeId = ?';
        params.push(leadTypeId);
      }

      if (serviceRequiredId) {
        query += ' AND l.ServiceRequiredId = ?';
        params.push(serviceRequiredId);
      }

      if (createdBy) {
        query += ' AND l.CreatedBy = ?';
        params.push(createdBy);
      }

      if (search) {
        query += ' AND (l.FirstName LIKE ? OR l.LastName LIKE ? OR l.Email LIKE ? OR l.Phone LIKE ? OR l.CompanyName LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const countQuery = query.replace(
        /SELECT[\s\S]*FROM/,
        'SELECT COUNT(*) as total FROM'
      );
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated results
      const sortColumnMap = {
        createdAt: 'l.CreatedAt',
        estimatedValue: 'l.EstimatedValue',
        name: "CONCAT(l.FirstName, ' ', l.LastName)",
        company: 'l.CompanyName'
      };
      const sortColumn = sortColumnMap[sortBy] || 'l.CreatedAt';
      const sortDirection = (String(sortOrder || 'desc').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        leads: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all leads:', error);
      throw error;
    }
  },

  // Update lead
  update: async (leadId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'FirstName', 'LastName', 'Email', 'Phone', 'AlternatePhone',
        'Mobile', 'CompanyName', 'Industry', 'AnnualRevenue', 'Rating', 'Designation',
        'Country', 'State', 'City', 'Address',
        'SourceId', 'LeadTypeId', 'LeadStatusId', 'ServiceRequiredId', 'EstimatedValue', 'Remarks',
        'AssignedToUserId', 'AssignedBy', 'IsActive', 'UpdatedBy',
        'IsConverted', 'ConvertedAt', 'ConvertedAccountId', 'ConvertedContactId', 'ConvertedDealId'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      });

      // If assigning lead, update AssignedAt
      if (updateData.AssignedToUserId !== undefined) {
        fields.push('AssignedAt = NOW()');
      }

      if (fields.length === 0) {
        return false;
      }

      fields.push('UpdatedAt = NOW()');
      params.push(leadId);

      const [result] = await pool.query(
        `UPDATE leads SET ${fields.join(', ')} WHERE LeadId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lead:', error);
      throw error;
    }
  },

  // Update lead status (for qualification)
  updateStatus: async (leadId, statusId, updatedBy) => {
    try {
      const [result] = await pool.query(
        `UPDATE leads 
         SET LeadStatusId = ?, UpdatedBy = ?, UpdatedAt = NOW() 
         WHERE LeadId = ?`,
        [statusId, updatedBy, leadId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating lead status:', error);
      throw error;
    }
  },

  // Delete lead (soft delete)
  delete: async (leadId, deletedBy) => {
    try {
      const [result] = await pool.query(
        `UPDATE leads 
         SET IsDeleted = 1, IsActive = 0, UpdatedBy = ?, UpdatedAt = NOW() 
         WHERE LeadId = ?`,
        [deletedBy, leadId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting lead:', error);
      throw error;
    }
  },

  // Assign lead to sales person
  assignLead: async (leadId, assignedToUserId, assignedBy) => {
    try {
      const [result] = await pool.query(
        `UPDATE leads 
         SET AssignedToUserId = ?, AssignedBy = ?, AssignedAt = NOW(), UpdatedAt = NOW() 
         WHERE LeadId = ?`,
        [assignedToUserId, assignedBy, leadId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error assigning lead:', error);
      throw error;
    }
  },

  // Check if lead is in valid status for qualification
  canQualify: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT LeadStatusId FROM leads WHERE LeadId = ? AND IsDeleted = 0`,
        [leadId]
      );

      if (rows.length === 0) return false;

      const status = rows[0].LeadStatusId;
      // Can qualify if status is New (1) or Contacted (2)
      return status === 1 || status === 2;
    } catch (error) {
      logger.error('Error checking if lead can qualify:', error);
      throw error;
    }
  },

  // Check if lead is already qualified
  isQualified: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT LeadStatusId FROM leads WHERE LeadId = ? AND IsDeleted = 0`,
        [leadId]
      );

      if (rows.length === 0) return false;

      // Status 3 = Qualified
      return rows[0].LeadStatusId === 3;
    } catch (error) {
      logger.error('Error checking if lead is qualified:', error);
      throw error;
    }
  },

  // Check if lead is already unqualified
  isUnqualified: async (leadId) => {
    try {
      const [rows] = await pool.query(
        `SELECT LeadStatusId FROM leads WHERE LeadId = ? AND IsDeleted = 0`,
        [leadId]
      );

      if (rows.length === 0) return false;

      // Status 4 = Unqualified
      return rows[0].LeadStatusId === 4;
    } catch (error) {
      logger.error('Error checking if lead is unqualified:', error);
      throw error;
    }
  },


};

module.exports = LeadModel;


 // Get lead statistics
  // getStatistics: async (userId = null) => {
  //   try {
  //     let query = `
  //       SELECT 
  //         COUNT(*) as total,
  //         SUM(CASE WHEN LeadStatusId = 1 THEN 1 ELSE 0 END) as new_leads,
  //         SUM(CASE WHEN LeadStatusId = 2 THEN 1 ELSE 0 END) as contacted,
  //         SUM(CASE WHEN LeadStatusId = 3 THEN 1 ELSE 0 END) as qualified,
  //         SUM(CASE WHEN LeadStatusId = 5 THEN 1 ELSE 0 END) as converted,
  //         SUM(CASE WHEN LeadStatusId = 6 THEN 1 ELSE 0 END) as lost
  //       FROM leads
  //       WHERE IsDeleted = 0
  //     `;

  //     const params = [];

  //     if (userId) {
  //       query += ' AND AssignedToUserId = ?';
  //       params.push(userId);
  //     }

  //     const [rows] = await pool.query(query, params);
  //     return rows[0];
  //   } catch (error) {
  //     logger.error('Error getting lead statistics:', error);
  //     throw error;
  //   }
  // }