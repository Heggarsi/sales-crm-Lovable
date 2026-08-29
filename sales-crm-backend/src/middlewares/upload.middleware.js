const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');
const helpers = require('../utils/helpers');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize directories
ensureDirectoryExists('uploads/proposals/');
ensureDirectoryExists('uploads/attachments/');
ensureDirectoryExists('uploads/temp/');

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp/';

    // Determine upload path based on file type or field name
    if (file.fieldname === 'proposalDocument') {
      uploadPath = 'uploads/proposals/';
      ensureDirectoryExists(uploadPath);
    } else if (file.fieldname === 'attachment') {
      uploadPath = 'uploads/attachments/';
      ensureDirectoryExists(uploadPath);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + helpers.generateRandomString(8);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    // For proposals, use proposal-specific naming
    if (file.fieldname === 'proposalDocument') {
      const proposalId = req.params.id || 'draft';
      cb(null, `proposal-${proposalId}-${uniqueSuffix}${ext}`);
    } else {
      cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // For proposal documents, only allow PDF
  if (file.fieldname === 'proposalDocument') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError(
        'Proposal documents must be PDF files only',
        HTTP_STATUS.BAD_REQUEST
      ), false);
    }
    return;
  }

  // For other files, allow multiple types
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST
    ), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.PROPOSAL_MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB for proposals
  }
});

// Error handling for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      throw new AppError(
        'File too large. Maximum size is 10MB for proposal documents',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    throw new AppError(err.message, HTTP_STATUS.BAD_REQUEST);
  }
  next(err);
};

module.exports = {
  upload,
  handleMulterError
};