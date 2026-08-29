const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const AuditLogModel = require('../models/AuditLogModel');
const { HTTP_STATUS } = require('../config/constants');

const AuditController = {
  // Get all audit logs
  getAllLogs: asyncHandler(async (req, res) => {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      tableName: req.query.tableName,
      recordId: req.query.recordId,
      action: req.query.action,
      changedBy: req.query.changedBy,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    };

    const result = await AuditLogModel.getAll(filters);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      ...result
    });
  }),

  // Get audit logs by record
  getLogsByRecord: asyncHandler(async (req, res) => {
    const { tableName, recordId } = req.params;
    const logs = await AuditLogModel.getByRecord(tableName, recordId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Audit logs for record retrieved successfully',
      data: logs
    });
  })
};

module.exports = AuditController;
