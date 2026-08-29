const { pool } = require('../config/database');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

const SalesOrderModel = {
  // Create sales order
  create: async (orderData) => {
    try {
      const {
        ProposalId,
        OrderValue,
        OrderAmount,
        Currency,
        OrderDate,
        ExpectedDeliveryDate,
        ActualDeliveryDate,
        PONumber,
        PODocument,
        InvoiceGenerated,
        PaymentStatusId,
        DeliveryStatusId
      } = orderData;

      const OrderNumber = helpers.generateUniqueNumber('ORD');

      const [result] = await pool.query(
        `INSERT INTO salesorder (
          OrderNumber, ProposalId, OrderDate, OrderValue,
          Currency, ExpectedDeliveryDate, ActualDeliveryDate,
          PONumber, PODocument, InvoiceGenerated, PaymentStatusId,
          DeliveryStatusId,
          IsDeleted, CreatedAt, UpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          OrderNumber,
          ProposalId || null,
          OrderDate || new Date(),
          OrderValue ?? OrderAmount,
          Currency,
          ExpectedDeliveryDate || null,
          ActualDeliveryDate || null,
          PONumber || null,
          PODocument || null,
          InvoiceGenerated || 0,
          PaymentStatusId || 1,
          DeliveryStatusId || 1
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error creating sales order:', error);
      throw error;
    }
  },

  // Find sales order by ID
  findById: async (orderId) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          so.SalesOrderId as OrderId,
          so.SalesOrderId,
          so.ProposalId,
          so.OrderNumber,
          p.ProposalTitle as OrderTitle,
          so.OrderDate,
          so.OrderValue as OrderAmount,
          so.OrderValue,
          so.Currency,
          so.ExpectedDeliveryDate,
          so.ActualDeliveryDate,
          so.PONumber,
          so.PODocument,
          so.InvoiceGenerated,
          so.IsDeleted,
          so.CreatedAt,
          so.UpdatedAt,
          so.PaymentStatusId,
          so.DeliveryStatusId,
          ps.StatusName as PaymentStatusName,
          ds.StatusName as DeliveryStatusName,
          a.AccountName as CompanyName,
          c.FirstName,
          c.LastName
         FROM salesorder so
         LEFT JOIN paymentstatus ps ON so.PaymentStatusId = ps.PaymentStatusId
         LEFT JOIN deliverystatus ds ON so.DeliveryStatusId = ds.DeliveryStatusId
         LEFT JOIN proposal p ON so.ProposalId = p.ProposalId
         LEFT JOIN deals d ON p.DealId = d.DealId
         LEFT JOIN accounts a ON d.AccountId = a.AccountId
         LEFT JOIN contacts c ON d.ContactId = c.ContactId
         WHERE so.SalesOrderId = ? AND so.IsDeleted = 0`,
        [orderId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding sales order by ID:', error);
      throw error;
    }
  },

  // Get all sales orders with filters
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        dealId,
        proposalId,
        paymentStatusId,
        deliveryStatusId,
        createdBy,
        search
      } = filters;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          so.SalesOrderId as OrderId,
          so.SalesOrderId,
          so.ProposalId,
          so.OrderNumber,
          p.ProposalTitle as OrderTitle,
          so.OrderValue as OrderAmount,
          so.OrderValue,
          so.Currency,
          so.OrderDate,
          so.ExpectedDeliveryDate,
          so.ActualDeliveryDate,
          so.PONumber,
          so.PODocument,
          so.InvoiceGenerated,
          so.IsDeleted,
          so.PaymentStatusId,
          so.DeliveryStatusId,
          so.CreatedAt,
          so.UpdatedAt,
          ps.StatusName as PaymentStatusName,
          ds.StatusName as DeliveryStatusName,
          a.AccountName as CompanyName,
          c.FirstName,
          c.LastName
        FROM salesorder so
        LEFT JOIN paymentstatus ps ON so.PaymentStatusId = ps.PaymentStatusId
        LEFT JOIN deliverystatus ds ON so.DeliveryStatusId = ds.DeliveryStatusId
        LEFT JOIN proposal p ON so.ProposalId = p.ProposalId
        LEFT JOIN deals d ON p.DealId = d.DealId
        LEFT JOIN accounts a ON d.AccountId = a.AccountId
        LEFT JOIN contacts c ON d.ContactId = c.ContactId
        WHERE so.IsDeleted = 0
      `;

      const params = [];

      if (dealId) {
        const ids = Array.isArray(dealId) ? dealId : (typeof dealId === 'string' ? dealId.split(',').map(id => id.trim()) : [dealId]);
        query += ` AND p.DealId IN (${ids.map(() => '?').join(', ')})`;
        params.push(...ids);
      }

      if (proposalId) {
        query += ' AND so.ProposalId = ?';
        params.push(proposalId);
      }

      if (paymentStatusId) {
        query += ' AND so.PaymentStatusId = ?';
        params.push(paymentStatusId);
      }

      if (deliveryStatusId) {
        query += ' AND so.DeliveryStatusId = ?';
        params.push(deliveryStatusId);
      }

      if (search) {
        query += ' AND (so.OrderNumber LIKE ? OR p.ProposalTitle LIKE ? OR c.FirstName LIKE ? OR c.LastName LIKE ? OR a.AccountName LIKE ?)';
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
      query += ' ORDER BY so.CreatedAt DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);

      return {
        orders: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error getting all sales orders:', error);
      throw error;
    }
  },

  // Update sales order
  update: async (orderId, updateData) => {
    try {
      const fields = [];
      const params = [];

      const allowedFields = [
        'ProposalId', 'OrderValue', 'Currency',
        'OrderDate', 'ExpectedDeliveryDate', 'ActualDeliveryDate',
        'PONumber', 'PODocument', 'InvoiceGenerated',
        'PaymentStatusId', 'DeliveryStatusId'
      ];

      if (updateData.OrderAmount !== undefined && updateData.OrderValue === undefined) {
        updateData.OrderValue = updateData.OrderAmount;
      }

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
      params.push(orderId);

      const [result] = await pool.query(
        `UPDATE salesorder SET ${fields.join(', ')} WHERE SalesOrderId = ?`,
        params
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error updating sales order:', error);
      throw error;
    }
  },

  // Delete sales order (soft delete)
  delete: async (orderId) => {
    try {
      const [result] = await pool.query(
        `UPDATE salesorder SET IsDeleted = 1, UpdatedAt = NOW() WHERE SalesOrderId = ?`,
        [orderId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting sales order:', error);
      throw error;
    }
  },

  // Check if a proposal already has a sales order
  existsByProposalId: async (proposalId) => {
    try {
      const [rows] = await pool.query(
        'SELECT 1 FROM salesorder WHERE ProposalId = ? AND IsDeleted = 0 LIMIT 1',
        [proposalId]
      );
      return rows.length > 0;
    } catch (error) {
      logger.error('Error checking if sales order exists by proposal ID:', error);
      throw error;
    }
  }
};

module.exports = SalesOrderModel;
