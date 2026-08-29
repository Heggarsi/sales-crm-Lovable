const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');
const { LEAD_STATUS, DEAL_STAGE, PROPOSAL_STATUS } = require('../src/config/constants');

// Distinct prefix so this seed never collides with DASH-SEED data.
const SEED_PREFIX = 'JULAUG-SEED';

// Target months to seed: July and August 2026.
const TARGET_MONTHS = [
  { year: 2026, month: 7, label: '202607' }, // July 2026 (previous / lower volume)
  { year: 2026, month: 8, label: '202608' }  // August 2026 (current / higher volume)
];

// Per-month volumes so the "vs last month" dashboard changes are meaningful.
const MONTH_CONFIG = {
  202607: { monthLabel: '202607', leads: 4, qualified: 1, openStages: 4, won: 1, lost: 2, proposals: 2 },
  202608: { monthLabel: '202608', leads: 6, qualified: 3, openStages: 5, won: 2, lost: 1, proposals: 3 }
};

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

const dayInMonth = (year, month, day, hour = 10) =>
  new Date(year, month - 1, day, hour, 0, 0);

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
    throw new Error('No active users found. Create/activate a user first before seeding.');
  }

  return users;
}

async function insertLeads(connection, users) {
  const leads = [];
  const industries = ['SaaS', 'Manufacturing', 'Healthcare', 'Finance', 'Retail', 'Education'];

  const LEAD_STATUS_POOL = [
    LEAD_STATUS.QUALIFIED,
    LEAD_STATUS.CONTACTED,
    LEAD_STATUS.NEW,
    LEAD_STATUS.CONTACTED,
    LEAD_STATUS.QUALIFIED,
    LEAD_STATUS.UNQUALIFIED,
    LEAD_STATUS.NEW,
    LEAD_STATUS.QUALIFIED
  ];

  let seq = 0;
  for (const { year, month } of TARGET_MONTHS) {
    const monthLabel = `${year}${pad(month)}`;
    const config = MONTH_CONFIG[monthLabel];
    const owner = users[seq % users.length];

    const statuses = LEAD_STATUS_POOL.slice(0, config.leads);
    statuses[config.qualified - 1] = LEAD_STATUS.QUALIFIED;

    for (let i = 0; i < config.leads; i += 1) {
      const created = dayInMonth(year, month, 2 + i, 9 + (i % 4));
      const leadNumber = `${SEED_PREFIX}-LEAD-${monthLabel}-${pad(seq + 1)}`;
      const status = statuses[i];

      leads.push({
        LeadNumber: leadNumber,
        FirstName: 'Seed',
        LastName: `${monthLabel} Lead ${i + 1}`,
        Email: `seed.${monthLabel}.lead${i + 1}@example.com`,
        Phone: `90000${monthLabel.slice(-4)}${pad(i + 1)}`,
        Mobile: `80000${monthLabel.slice(-4)}${pad(i + 1)}`,
        CompanyName: `Seed ${monthLabel} Company ${i + 1}`,
        Industry: industries[i % industries.length],
        AnnualRevenue: 1200000 + i * 220000,
        Rating: i % 2 === 0 ? 'Hot' : 'Warm',
        Designation: 'Operations Manager',
        Country: 'India',
        State: 'Karnataka',
        City: 'Bengaluru',
        Address: 'July/August seed address',
        SourceId: (i % 3) + 1,
        LeadTypeId: (i % 3) + 1,
        AssignedToUserId: owner.UserId,
        AssignedBy: owner.UserId,
        AssignedAt: toMysqlDateTime(created),
        IsActive: 1,
        IsConverted: status === LEAD_STATUS.QUALIFIED ? 1 : 0,
        ConvertedAt: status === LEAD_STATUS.QUALIFIED ? toMysqlDateTime(new Date(created.getTime() + 86400000 * 5)) : null,
        IsDeleted: 0,
        CreatedAt: toMysqlDateTime(created),
        UpdatedAt: toMysqlDateTime(created),
        CreatedBy: owner.UserId,
        UpdatedBy: owner.UserId,
        LeadStatusId: status
      });

      seq += 1;
    }
  }

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
  const OPEN_STAGES = [
    DEAL_STAGE.QUALIFICATION,
    DEAL_STAGE.NEEDS_ANALYSIS,
    DEAL_STAGE.VALUE_PROPOSITION,
    DEAL_STAGE.PROPOSAL_QUOTE,
    DEAL_STAGE.NEGOTIATION_REVIEW
  ];

  const dealSpecs = [];

  for (const { year, month } of TARGET_MONTHS) {
    const monthLabel = `${year}${pad(month)}`;
    const config = MONTH_CONFIG[monthLabel];

    // Stage open-pipeline deals (one per stage up to config.openStages).
    for (let i = 0; i < config.openStages; i += 1) {
      const stage = OPEN_STAGES[i];
      dealSpecs.push({
        name: `${monthLabel} ${OPEN_STAGES[i] === DEAL_STAGE.NEGOTIATION_REVIEW ? 'Negotiation' : 'Pipeline'} Deal ${i + 1}`,
        stageId: stage,
        amount: 90000 + i * 60000 + (month === 8 ? 30000 : 0),
        probability: stage === DEAL_STAGE.QUALIFICATION ? 10 : stage === DEAL_STAGE.NEEDS_ANALYSIS ? 25 : stage === DEAL_STAGE.VALUE_PROPOSITION ? 40 : stage === DEAL_STAGE.PROPOSAL_QUOTE ? 60 : 80,
        monthIndex: TARGET_MONTHS.findIndex((m) => m.year === year && m.month === month),
        day: 4 + i * 2
      });
    }

    // Won deals with varying amounts.
    const wonAmounts = month === 8 ? [310000, 370000] : [420000];
    for (let i = 0; i < config.won; i += 1) {
      dealSpecs.push({
        name: `${monthLabel} Closed Won Deal ${i + 1}`,
        stageId: DEAL_STAGE.CLOSED_WON,
        amount: wonAmounts[i],
        probability: 100,
        monthIndex: TARGET_MONTHS.findIndex((m) => m.year === year && m.month === month),
        day: 20 + i * 2 + (month === 8 ? 0 : 0)
      });
    }

    // Lost deals.
    const lostAmounts = month === 8 ? [260000] : [230000, 195000];
    for (let i = 0; i < config.lost; i += 1) {
      dealSpecs.push({
        name: `${monthLabel} Closed Lost Deal ${i + 1}`,
        stageId: DEAL_STAGE.CLOSED_LOST,
        amount: lostAmounts[i],
        probability: 0,
        monthIndex: TARGET_MONTHS.findIndex((m) => m.year === year && m.month === month),
        day: 22 + i * 2
      });
    }
  }

  let proposalsInserted = 0;
  const proposalsByMonth = {};

  for (let index = 0; index < dealSpecs.length; index += 1) {
    const spec = dealSpecs[index];
    const { year, month } = TARGET_MONTHS[spec.monthIndex];
    const monthLabel = `${year}${pad(month)}`;
    const config = MONTH_CONFIG[monthLabel];
    const owner = users[index % users.length];
    const created = dayInMonth(year, month, Math.min(spec.day, 27), 11);
    const closing = (spec.stageId === DEAL_STAGE.CLOSED_WON || spec.stageId === DEAL_STAGE.CLOSED_LOST)
      ? created
      : dayInMonth(year, month, Math.min(spec.day + 14, 27), 11);
    const dealNumber = `${SEED_PREFIX}-DEAL-${pad(index + 1)}`;

    const [dealResult] = await connection.query(`
      INSERT INTO deals (
        DealNumber, DealName, DealStageId, ClosingDate, Amount, Probability, DealType,
        LeadSource, ExpectedRevenue, Description, LostReason, AssignedToUserId,
        IsDeleted, CreatedBy, UpdatedBy, CreatedAt, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `, [
      dealNumber,
      `${SEED_PREFIX} ${spec.name}`,
      spec.stageId,
      toMysqlDate(closing),
      spec.amount,
      spec.probability,
      'New Business',
      'Dashboard Seed',
      Math.round(spec.amount * (spec.probability / 100)),
      'July/August seed data',
      spec.stageId === DEAL_STAGE.CLOSED_LOST ? 'Budget deferred' : null,
      owner.UserId,
      owner.UserId,
      owner.UserId,
      toMysqlDateTime(created),
      toMysqlDateTime(new Date(created.getTime() + 86400000))
    ]);

    const needsProposal = spec.stageId === DEAL_STAGE.PROPOSAL_QUOTE
      || spec.stageId === DEAL_STAGE.NEGOTIATION_REVIEW
      || spec.stageId === DEAL_STAGE.CLOSED_WON;

    const monthProposals = proposalsByMonth[monthLabel] || 0;

    if (needsProposal && monthProposals < config.proposals) {
      proposalsByMonth[monthLabel] = monthProposals + 1;
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
        spec.amount,
        toMysqlDate(new Date(created.getTime() + 86400000 * 30)),
        '50 percent advance, balance on delivery',
        'Delivery within 30 days',
        toMysqlDateTime(created),
        spec.stageId === DEAL_STAGE.CLOSED_WON ? owner.UserId : null,
        spec.stageId === DEAL_STAGE.CLOSED_WON ? toMysqlDateTime(new Date(created.getTime() + 86400000)) : null,
        spec.stageId === DEAL_STAGE.CLOSED_WON ? toMysqlDateTime(new Date(created.getTime() + 86400000)) : null,
        'July/August seed proposal',
        toMysqlDateTime(created),
        toMysqlDateTime(created),
        owner.UserId,
        spec.stageId === DEAL_STAGE.CLOSED_WON ? PROPOSAL_STATUS.APPROVED : PROPOSAL_STATUS.SUBMITTED,
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

    console.log('July/August seed data inserted successfully.');
    console.log(`Target months: ${TARGET_MONTHS.map((m) => `${m.year}-${pad(m.month)}`).join(', ')}`);
    console.log(`Users reused: ${users.map((user) => `${user.Name} (#${user.UserId})`).join(', ')}`);
    console.log(`Inserted: ${leads} leads, ${deals} deals, ${proposals} proposals.`);
    console.log('No users were inserted or modified.');
  } catch (error) {
    await connection.rollback();
    console.error('July/August seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
