const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');
const { LEAD_STATUS, DEAL_STAGE, PROPOSAL_STATUS } = require('../src/config/constants');

const SEED_PREFIX = 'DASH-SEED';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'salescrmuser',
  password: process.env.DB_PASSWORD || 'StrongPassword123!',
  database: process.env.DB_NAME || 'salescrmv1',
  port: Number(process.env.DB_PORT || 3306),
  multipleStatements: false
};

const pad = (value) => String(value).padStart(2, '0');

const toMysqlDateTime = (date) => {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join(':');
};

const toMysqlDate = (date) => toMysqlDateTime(date).slice(0, 10);

const monthDate = (monthsAgo, day = 12, hour = 10) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, hour, 0, 0);
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function ensureLookupRows(connection) {
  await connection.query(`
    INSERT INTO leadstatus (LeadStatusId, StatusName, Description) VALUES
      (1, 'New', 'New dashboard seed compatible status'),
      (2, 'Attempted to Contact', 'Attempted dashboard seed compatible status'),
      (3, 'Contacted', 'Contacted dashboard seed compatible status'),
      (4, 'Qualified', 'Qualified dashboard seed compatible status'),
      (5, 'Unqualified', 'Unqualified dashboard seed compatible status'),
      (6, 'Junk Lead', 'Junk dashboard seed compatible status')
    ON DUPLICATE KEY UPDATE
      StatusName = VALUES(StatusName),
      Description = COALESCE(Description, VALUES(Description))
  `);

  await connection.query(`
    INSERT INTO leadsource (SourceId, SourceName, Description, IsActive, IsDeleted, SourceType) VALUES
      (1, 'Website', 'Website enquiries', 1, 0, 'Inbound'),
      (2, 'Referral', 'Referral enquiries', 1, 0, 'Inbound'),
      (3, 'Campaign', 'Campaign enquiries', 1, 0, 'Marketing')
    ON DUPLICATE KEY UPDATE
      Description = COALESCE(Description, VALUES(Description)),
      IsActive = 1,
      IsDeleted = 0
  `);

  await connection.query(`
    INSERT INTO leadtype (LeadTypeId, TypeName, Description, Priority, IsActive, IsDeleted) VALUES
      (1, 'Hot', 'High priority lead', 10, 1, 0),
      (2, 'Warm', 'Medium priority lead', 5, 1, 0),
      (3, 'Cold', 'Low priority lead', 1, 1, 0)
    ON DUPLICATE KEY UPDATE
      Description = COALESCE(Description, VALUES(Description)),
      IsActive = 1,
      IsDeleted = 0
  `);

  await connection.query(`
    INSERT INTO dealstage (DealStageId, StageName, Probability, DisplayOrder, Description, IsActive) VALUES
      (1, 'Qualification', 10, 1, 'Initial qualification', 1),
      (2, 'Needs Analysis', 25, 2, 'Needs analysis', 1),
      (3, 'Value Proposition', 40, 3, 'Value proposition', 1),
      (4, 'Proposal/Quote', 60, 4, 'Proposal or quote sent', 1),
      (5, 'Negotiation/Review', 80, 5, 'Negotiation or review', 1),
      (6, 'Closed Won', 100, 6, 'Closed won', 1),
      (7, 'Closed Lost', 0, 7, 'Closed lost', 1)
    ON DUPLICATE KEY UPDATE
      StageName = VALUES(StageName),
      Probability = VALUES(Probability),
      DisplayOrder = VALUES(DisplayOrder),
      IsActive = 1
  `);

  await connection.query(`
    INSERT INTO proposalstatus (ProposalStatusId, StatusName) VALUES
      (1, 'Draft'),
      (2, 'Submitted'),
      (3, 'Under Review'),
      (4, 'Approved'),
      (5, 'Rejected'),
      (6, 'Expired'),
      (7, 'Rejected Expired')
    ON DUPLICATE KEY UPDATE
      StatusName = VALUES(StatusName)
  `);

  await connection.query(`
    INSERT INTO lead_service_required (ServiceRequiredId, ServiceName, Description, IsActive, IsDeleted) VALUES
      (1, 'Website Development', 'Website development service', 1, 0),
      (2, 'Web Application', 'Web application development service', 1, 0),
      (3, 'Mobile Application', 'Mobile application development service', 1, 0),
      (4, 'E-Commerce', 'E-Commerce development service', 1, 0),
      (5, 'SEO', 'Search Engine Optimization service', 1, 0),
      (6, 'Digital Marketing', 'Digital marketing service', 1, 0),
      (7, 'Other', 'Other service', 1, 0)
    ON DUPLICATE KEY UPDATE
      ServiceName = VALUES(ServiceName),
      Description = COALESCE(Description, VALUES(Description)),
      IsActive = 1,
      IsDeleted = 0
  `);

  await connection.query(`
    INSERT INTO lead_followup_type (FollowUpTypeId, TypeName, Description, IsActive, IsDeleted) VALUES
      (1, 'Phone Call', 'Phone call follow-up', 1, 0),
      (2, 'Email', 'Email follow-up', 1, 0),
      (3, 'Meeting', 'In-person or virtual meeting', 1, 0),
      (4, 'WhatsApp', 'WhatsApp follow-up', 1, 0),
      (5, 'Site Visit', 'On-site visit', 1, 0),
      (6, 'Other', 'Other follow-up type', 1, 0)
    ON DUPLICATE KEY UPDATE
      TypeName = VALUES(TypeName),
      Description = COALESCE(Description, VALUES(Description)),
      IsActive = 1,
      IsDeleted = 0
  `);
}

async function deletePreviousSeedRows(connection) {
  await connection.query(`
    DELETE p FROM proposal p
    JOIN deals d ON p.DealId = d.DealId
    WHERE d.DealNumber LIKE ?
  `, [`${SEED_PREFIX}-%`]);

  await connection.query('DELETE FROM deals WHERE DealNumber LIKE ?', [`${SEED_PREFIX}-%`]);
  await connection.query('DELETE FROM leads WHERE LeadNumber LIKE ?', [`${SEED_PREFIX}-%`]);
}

async function getUsers(connection) {
  const [users] = await connection.query(`
    SELECT UserId, Name
    FROM users
    WHERE IsDeleted = 0 AND IsActive = 1
    ORDER BY UserId
    LIMIT 5
  `);

  if (users.length === 0) {
    throw new Error('No active users found. Seed script will not insert users; create/activate a user first.');
  }

  return users;
}

async function insertLeads(connection, users) {
  const leads = [];

  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo -= 1) {
    const monthLabel = toMysqlDate(monthDate(monthsAgo, 1)).slice(0, 7).replace('-', '');
    const owner = users[monthsAgo % users.length];
    const created = monthDate(monthsAgo, 8 + (monthsAgo % 6), 9 + (monthsAgo % 4));

    leads.push({
      LeadNumber: `${SEED_PREFIX}-LEAD-${monthLabel}-001`,
      FirstName: 'Dashboard',
      LastName: `Lead ${monthLabel}`,
      Email: `dashboard.lead.${monthLabel}@example.com`,
      Phone: `90000${monthLabel.slice(-5)}`,
      Mobile: `80000${monthLabel.slice(-5)}`,
      CompanyName: `Dashboard Seed ${monthLabel}`,
      Industry: ['SaaS', 'Manufacturing', 'Healthcare', 'Finance', 'Retail', 'Education'][monthsAgo % 6],
      AnnualRevenue: 1500000 + monthsAgo * 175000,
      Rating: monthsAgo % 2 === 0 ? 'Hot' : 'Warm',
      Designation: 'Operations Manager',
      Country: 'India',
      State: 'Karnataka',
      City: 'Bengaluru',
      Address: 'Dashboard seed address',
      SourceId: (monthsAgo % 3) + 1,
      LeadTypeId: (monthsAgo % 3) + 1,
      AssignedToUserId: owner.UserId,
      AssignedBy: owner.UserId,
      AssignedAt: toMysqlDateTime(created),
      IsActive: 1,
      IsConverted: monthsAgo % 2 === 0 ? 1 : 0,
      ConvertedAt: monthsAgo % 2 === 0 ? toMysqlDateTime(new Date(created.getTime() + 86400000 * 5)) : null,
      IsDeleted: 0,
      CreatedAt: toMysqlDateTime(created),
      UpdatedAt: toMysqlDateTime(created),
      CreatedBy: owner.UserId,
      UpdatedBy: owner.UserId,
      LeadStatusId: monthsAgo % 3 === 0 ? LEAD_STATUS.QUALIFIED : LEAD_STATUS.CONTACTED
    });
  }

  const currentOwner = users[0];
  const currentDate = monthDate(0, 18, 14);
  leads.push({
    LeadNumber: `${SEED_PREFIX}-LEAD-CURRENT-QUALIFIED`,
    FirstName: 'Current',
    LastName: 'Qualified',
    Email: 'dashboard.current.qualified@example.com',
    Phone: '9000011111',
    Mobile: '8000011111',
    CompanyName: 'Current Month Qualified Seed',
    Industry: 'Technology',
    AnnualRevenue: 2500000,
    Rating: 'Hot',
    Designation: 'Director',
    Country: 'India',
    State: 'Maharashtra',
    City: 'Mumbai',
    Address: 'Dashboard seed address',
    SourceId: 1,
    LeadTypeId: 1,
    AssignedToUserId: currentOwner.UserId,
    AssignedBy: currentOwner.UserId,
    AssignedAt: toMysqlDateTime(currentDate),
    IsActive: 1,
    IsConverted: 1,
    ConvertedAt: toMysqlDateTime(new Date(currentDate.getTime() + 86400000 * 2)),
    IsDeleted: 0,
    CreatedAt: toMysqlDateTime(currentDate),
    UpdatedAt: toMysqlDateTime(currentDate),
    CreatedBy: currentOwner.UserId,
    UpdatedBy: currentOwner.UserId,
    LeadStatusId: LEAD_STATUS.QUALIFIED
  });

  for (const lead of leads) {
    await connection.query(`
      INSERT INTO leads (
        LeadNumber, FirstName, LastName, Email, Phone, Mobile, CompanyName, Industry,
        AnnualRevenue, Rating, Designation, Country, State, City, Address, SourceId,
        LeadTypeId, AssignedToUserId, AssignedBy, AssignedAt, IsActive, IsConverted,
        ConvertedAt, IsDeleted, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, LeadStatusId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      lead.LeadNumber, lead.FirstName, lead.LastName, lead.Email, lead.Phone, lead.Mobile,
      lead.CompanyName, lead.Industry, lead.AnnualRevenue, lead.Rating, lead.Designation,
      lead.Country, lead.State, lead.City, lead.Address, lead.SourceId, lead.LeadTypeId,
      lead.AssignedToUserId, lead.AssignedBy, lead.AssignedAt, lead.IsActive, lead.IsConverted,
      lead.ConvertedAt, lead.IsDeleted, lead.CreatedAt, lead.UpdatedAt, lead.CreatedBy,
      lead.UpdatedBy, lead.LeadStatusId
    ]);
  }

  return leads.length;
}

async function insertDealsAndProposals(connection, users) {
  const dealSpecs = [
    ['Pipeline Qualification', DEAL_STAGE.QUALIFICATION, 95000, 10, 0, 24],
    ['Pipeline Needs Analysis', DEAL_STAGE.NEEDS_ANALYSIS, 145000, 25, 0, 22],
    ['Pipeline Value Proposition', DEAL_STAGE.VALUE_PROPOSITION, 210000, 40, 0, 20],
    ['Pipeline Proposal Quote', DEAL_STAGE.PROPOSAL_QUOTE, 340000, 60, 0, 18],
    ['Pipeline Negotiation Review', DEAL_STAGE.NEGOTIATION_REVIEW, 475000, 80, 0, 16],
    ['Closed Won Current A', DEAL_STAGE.CLOSED_WON, 625000, 100, 0, 10],
    ['Closed Won Current B', DEAL_STAGE.CLOSED_WON, 410000, 100, 0, 7],
    ['Closed Lost Current', DEAL_STAGE.CLOSED_LOST, 230000, 0, 0, 5],
    ['Closed Won Last Month', DEAL_STAGE.CLOSED_WON, 520000, 100, 1, 11],
    ['Closed Lost Last Month', DEAL_STAGE.CLOSED_LOST, 260000, 0, 1, 8]
  ];

  let proposalsInserted = 0;

  for (let index = 0; index < dealSpecs.length; index += 1) {
    const [name, stageId, amount, probability, monthsAgo, day] = dealSpecs[index];
    const owner = users[index % users.length];
    const created = monthDate(monthsAgo, day, 11);
    const closing = stageId === DEAL_STAGE.CLOSED_WON || stageId === DEAL_STAGE.CLOSED_LOST
      ? created
      : monthDate(0, Math.min(day + 14, 27), 11);
    const dealNumber = `${SEED_PREFIX}-DEAL-${pad(index + 1)}`;

    const [dealResult] = await connection.query(`
      INSERT INTO deals (
        DealNumber, DealName, DealStageId, ClosingDate, Amount, Probability, DealType,
        LeadSource, ExpectedRevenue, Description, LostReason, AssignedToUserId,
        IsDeleted, CreatedBy, UpdatedBy, CreatedAt, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `, [
      dealNumber,
      `${SEED_PREFIX} ${name}`,
      stageId,
      toMysqlDate(closing),
      amount,
      probability,
      'New Business',
      'Dashboard Seed',
      Math.round(amount * (probability / 100)),
      'Dashboard seed data',
      stageId === DEAL_STAGE.CLOSED_LOST ? 'Budget deferred' : null,
      owner.UserId,
      owner.UserId,
      owner.UserId,
      toMysqlDateTime(created),
      toMysqlDateTime(new Date(created.getTime() + 86400000))
    ]);

    if ([DEAL_STAGE.PROPOSAL_QUOTE, DEAL_STAGE.NEGOTIATION_REVIEW, DEAL_STAGE.CLOSED_WON].includes(stageId)) {
      proposalsInserted += 1;
      const proposalNumber = `${SEED_PREFIX}-PROP-${pad(proposalsInserted)}`;
      await connection.query(`
        INSERT INTO proposal (
          ProposalNumber, DealId, ProposalTitle, ProposalAmount, Currency, VersionNo,
          ValidityDate, PaymentTerms, DeliveryTerms, SubmittedAt, ApprovedByUserId,
          ApprovedAt, DecisionDate, InternalNotes, IsDeleted, CreatedAt, UpdatedAt,
          CreatedBy, ProposalStatusId, ContentHash
        ) VALUES (?, ?, ?, ?, 'INR', 1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
      `, [
        proposalNumber,
        dealResult.insertId,
        `${SEED_PREFIX} Proposal ${proposalsInserted}`,
        amount,
        toMysqlDate(new Date(created.getTime() + 86400000 * 30)),
        '50 percent advance, balance on delivery',
        'Delivery within 30 days',
        toMysqlDateTime(created),
        stageId === DEAL_STAGE.CLOSED_WON ? owner.UserId : null,
        stageId === DEAL_STAGE.CLOSED_WON ? toMysqlDateTime(new Date(created.getTime() + 86400000)) : null,
        stageId === DEAL_STAGE.CLOSED_WON ? toMysqlDateTime(new Date(created.getTime() + 86400000)) : null,
        'Dashboard seed proposal',
        toMysqlDateTime(created),
        toMysqlDateTime(created),
        owner.UserId,
        stageId === DEAL_STAGE.CLOSED_WON ? PROPOSAL_STATUS.APPROVED : PROPOSAL_STATUS.SUBMITTED,
        sha256(`${proposalNumber}:${dealResult.insertId}`)
      ]);
    }
  }

  return { deals: dealSpecs.length, proposals: proposalsInserted };
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    await connection.beginTransaction();

    const users = await getUsers(connection);
    await ensureLookupRows(connection);
    await deletePreviousSeedRows(connection);

    const leads = await insertLeads(connection, users);
    const { deals, proposals } = await insertDealsAndProposals(connection, users);

    await connection.commit();

    console.log('Dashboard seed data inserted successfully.');
    console.log(`Users reused: ${users.map((user) => `${user.Name} (#${user.UserId})`).join(', ')}`);
    console.log(`Inserted: ${leads} leads, ${deals} deals, ${proposals} proposals.`);
    console.log('No users were inserted or modified.');
  } catch (error) {
    await connection.rollback();
    console.error('Dashboard seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
