module.exports = {
  ROLES: {
    ADMIN: 1,
    SALES_MANAGER: 2,
    SALES_PERSON: 3
  },

  ROLE_NAMES: {
    1: 'Admin',
    2: 'Sales Manager',
    3: 'Sales Person'
  },

  PERMISSIONS: {
    // User Management
    CREATE_USER: 'create_user',
    READ_USER: 'read_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',
    
    // Lead Management
    CREATE_LEAD: 'create_lead',
    READ_LEAD: 'read_lead',
    READ_ALL_LEADS: 'read_all_leads',
    UPDATE_LEAD: 'update_lead',
    DELETE_LEAD: 'delete_lead',
    ASSIGN_LEAD: 'assign_lead',
    QUALIFY_LEAD: 'qualify_lead',
    
    // Appointment Management (NEW)
    CREATE_APPOINTMENT: 'create_appointment',
    READ_APPOINTMENT: 'read_appointment',
    UPDATE_APPOINTMENT: 'update_appointment',
    DELETE_APPOINTMENT: 'delete_appointment',
    COMPLETE_APPOINTMENT: 'complete_appointment',
    
    // MOM Management (NEW)
    CREATE_MOM: 'create_mom',
    READ_MOM: 'read_mom',
    UPDATE_MOM: 'update_mom',
    DELETE_MOM: 'delete_mom',
    SHARE_MOM: 'share_mom',
    
    // Activity Management (NEW)
    CREATE_ACTIVITY: 'create_activity',
    READ_ACTIVITY: 'read_activity',
    UPDATE_ACTIVITY: 'update_activity',
    DELETE_ACTIVITY: 'delete_activity',
    
    // Opportunity Management
    CREATE_OPPORTUNITY: 'create_opportunity',
    READ_OPPORTUNITY: 'read_opportunity',
    READ_ALL_OPPORTUNITIES: 'read_all_opportunities',
    UPDATE_OPPORTUNITY: 'update_opportunity',
    DELETE_OPPORTUNITY: 'delete_opportunity',
    
    // Proposal Management
    CREATE_PROPOSAL: 'create_proposal',
    READ_PROPOSAL: 'read_proposal',
    UPDATE_PROPOSAL: 'update_proposal',
    DELETE_PROPOSAL: 'delete_proposal',
    APPROVE_PROPOSAL: 'approve_proposal',
    REJECT_PROPOSAL: 'reject_proposal',
    
    // Sales Order Management
    CREATE_SALES_ORDER: 'create_sales_order',
    READ_SALES_ORDER: 'read_sales_order',
    UPDATE_SALES_ORDER: 'update_sales_order',
    DELETE_SALES_ORDER: 'delete_sales_order',
    
    // Reports & Dashboard
    VIEW_REPORTS: 'view_reports',
    VIEW_ALL_REPORTS: 'view_all_reports',
    VIEW_DASHBOARD: 'view_dashboard'
  },

  // Lead Status IDs
  LEAD_STATUS: {
    NEW: 1,
    CONTACTED: 2,
    QUALIFIED: 3,
    UNQUALIFIED: 4,
    CONVERTED: 5,
    LOST: 6
  },

  // Appointment Status IDs (NEW)
  APPOINTMENT_STATUS: {
    SCHEDULED: 1,
    COMPLETED: 2,
    CANCELLED: 3,
    RESCHEDULED: 4
  },

  // Activity Type IDs (NEW)
  ACTIVITY_TYPE: {
    CALL: 1,
    EMAIL: 2,
    MEETING: 3,
    NOTE: 4,
    TASK: 5
  },

  // MOM Status (NEW)
  MOM_STATUS: {
    DRAFT: 'Draft',
    FINAL: 'Final',
    REVIEWED: 'Reviewed',
    SHARED: 'Shared'
  },

  // Opportunity Stage IDs
  OPPORTUNITY_STAGE: {
    PROSPECTING: 1,
    QUALIFICATION: 2,
    PROPOSAL: 3,
    NEGOTIATION: 4,
    CLOSED_WON: 5,
    CLOSED_LOST: 6
  },

  // Opportunity Status IDs
  OPPORTUNITY_STATUS: {
    ACTIVE: 1,
    WON: 2,
    LOST: 3
  },

  // Proposal Status IDs
  PROPOSAL_STATUS: {
    DRAFT: 1,
    SUBMITTED: 2,
    UNDER_REVIEW: 3,
    APPROVED: 4,
    REJECTED: 5,
    EXPIRED: 6
  },

  // Payment Status IDs
  PAYMENT_STATUS: {
    PENDING: 1,
    PARTIAL: 2,
    PAID: 3,
    OVERDUE: 4
  },

  // Delivery Status IDs
  DELIVERY_STATUS: {
    PENDING: 1,
    IN_PROGRESS: 2,
    DELIVERED: 3,
    DELAYED: 4
  },

  // Qualification Status IDs
  QUALIFICATION_STATUS: {
    QUALIFIED: 1,
    UNQUALIFIED: 2,
    IN_PROGRESS: 3
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  }
};