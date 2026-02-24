const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');

// Validate request based on express-validator rules
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    throw new AppError(
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      extractedErrors
    );
  }

  next();
};

module.exports = { validate };