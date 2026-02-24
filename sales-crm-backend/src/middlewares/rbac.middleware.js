const { AppError } = require('./errorHandler.middleware');
const { hasPermission, getRolePermissions } = require('../config/roles');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');

// Check if user has required permission(s)
const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const userRole = req.user.RoleId;
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    // Check if user has at least one of the required permissions
    const hasAccess = permissions.some(permission => 
      hasPermission(userRole, permission)
    );

    if (!hasAccess) {
      logger.warn('Permission denied', {
        userId: req.user.UserId,
        role: req.user.RoleName,
        requiredPermissions: permissions
      });
      throw new AppError(
        'You do not have permission to perform this action',
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

// Check if user has specific role(s)
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const userRole = req.user.RoleId;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      logger.warn('Role check failed', {
        userId: req.user.UserId,
        userRole: req.user.RoleName,
        requiredRoles: roles
      });
      throw new AppError(
        'You do not have the required role to perform this action',
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

// Check if user can access resource (owns it or has permission)
const checkResourceOwnership = (resourceType = 'lead') => {
  return async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const userRole = req.user.RoleId;
    const userId = req.user.UserId;

    // Admins and Sales Managers can access all resources
    if (userRole === ROLES.ADMIN || userRole === ROLES.SALES_MANAGER) {
      return next();
    }

    // For Sales Person, mark that ownership check is needed
    // The actual check will be done in the controller when fetching the resource
    req.checkOwnership = {
      resourceType,
      userId,
      ownerField: 'AssignedToUserId' // Default field, can be customized
    };

    next();
  };
};

// Check if user is admin or sales manager
const isAdminOrManager = checkRole([ROLES.ADMIN, ROLES.SALES_MANAGER]);

// Check if user is admin only
const isAdmin = checkRole(ROLES.ADMIN);

module.exports = {
  checkPermission,
  checkRole,
  checkResourceOwnership,
  isAdminOrManager,
  isAdmin
};