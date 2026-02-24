const crypto = require('crypto');

const helpers = {
  // Generate random string
  generateRandomString: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },

  // Generate unique number (for LeadNumber, OrderNumber, etc.)
  generateUniqueNumber: (prefix = 'LN') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  },

  // Pagination helper
  getPagination: (page = 1, limit = 10) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    return { 
      limit: limitNum, 
      offset: offset,
      page: pageNum
    };
  },

  // Format pagination response
  formatPaginationResponse: (data, page, limit, total) => {
    return {
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  },

  // Sanitize user object (remove sensitive data)
  sanitizeUser: (user) => {
    if (!user) return null;
    const { Password, ...sanitizedUser } = user;
    return sanitizedUser;
  },

  // Format date to MySQL datetime
  formatDateTimeForMySQL: (date = new Date()) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  },

  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  

  // Validate phone format (basic)
  isValidPhone: (phone) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  },
  // Convert timeline like "3 months", "15 days", "1 year" → Date
  parseTimelineToDate: (timeline) => {
    if (!timeline || typeof timeline !== 'string') return null;

    const match = timeline.trim().match(/^(\d+)\s*(day|month|year)s?$/i);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const date = new Date();

    switch (unit) {
      case 'day':
        date.setDate(date.getDate() + value);
        break;
      case 'month':
        date.setMonth(date.getMonth() + value);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() + value);
        break;
    }

    return date;
  },

  // Remove undefined/null from object
  cleanObject: (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null)
    );
  }
};

module.exports = helpers;