const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false
  });

  console.log('Connected to database.');
  
  try {
    // ============================================================
    // 1. Get existing leads columns
    // ============================================================
    const [cols] = await connection.query('SHOW COLUMNS FROM leads');
    const existingCols = cols.map(c => c.Field);
    console.log('Existing leads columns:', existingCols.join(', '));

    // ============================================================
    // 2. Drop deprecated tables
    // ============================================================
    const dropTables = ['leadqualification', 'leadbusinessinfo', 'opportunity', 'opportunitystatus', 'qualificationstatus'];
    for (const t of dropTables) {
      await connection.query(`SET FOREIGN_KEY_CHECKS=0`);
      await connection.query(`DROP TABLE IF EXISTS \`${t}\``);
      await connection.query(`SET FOREIGN_KEY_CHECKS=1`);
      console.log(`Dropped table: ${t}`);
    }

    // ============================================================
    // 3. Update LeadStatus
    // ============================================================
    await connection.query(`SET FOREIGN_KEY_CHECKS=0`);
    await connection.query(`DELETE FROM leadstatus`);
    await connection.query(`ALTER TABLE leadstatus AUTO_INCREMENT = 1`);
    await connection.query(`SET FOREIGN_KEY_CHECKS=1`);
    const statuses = [
      ['New', 'Newly created lead'],
      ['Attempted to Contact', 'Contact attempt was made but no response'],
      ['Contacted', 'Lead was successfully contacted'],
      ['Qualified', 'Lead is qualified and ready for conversion'],
      ['Unqualified', 'Lead does not meet qualification criteria'],
      ['Junk Lead', 'Invalid, duplicate or spam lead']
    ];
    for (const [name, desc] of statuses) {
      await connection.query(`INSERT INTO leadstatus (StatusName, Description) VALUES (?, ?)`, [name, desc]);
    }
    console.log('Lead statuses updated.');

    // ============================================================
    // 4. Add missing columns to leads
    // ============================================================
    const leadsColumnsToAdd = [
      { name: 'FirstName', sql: "ADD COLUMN `FirstName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `LeadNumber`" },
      { name: 'LastName', sql: "ADD COLUMN `LastName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `FirstName`" },
      { name: 'Mobile', sql: "ADD COLUMN `Mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `AlternatePhone`" },
      { name: 'AnnualRevenue', sql: "ADD COLUMN `AnnualRevenue` decimal(15,2) DEFAULT NULL AFTER `Industry`" },
      { name: 'Rating', sql: "ADD COLUMN `Rating` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `AnnualRevenue`" },
      { name: 'IsConverted', sql: "ADD COLUMN `IsConverted` tinyint(1) DEFAULT '0' AFTER `IsActive`" },
      { name: 'ConvertedAt', sql: "ADD COLUMN `ConvertedAt` datetime DEFAULT NULL AFTER `IsConverted`" },
      { name: 'ConvertedAccountId', sql: "ADD COLUMN `ConvertedAccountId` int DEFAULT NULL AFTER `ConvertedAt`" },
      { name: 'ConvertedContactId', sql: "ADD COLUMN `ConvertedContactId` int DEFAULT NULL AFTER `ConvertedAccountId`" },
      { name: 'ConvertedDealId', sql: "ADD COLUMN `ConvertedDealId` int DEFAULT NULL AFTER `ConvertedContactId`" }
    ];

    for (const col of leadsColumnsToAdd) {
      if (!existingCols.includes(col.name)) {
        await connection.query(`ALTER TABLE leads ${col.sql}`);
        console.log(`Added column: leads.${col.name}`);
      } else {
        console.log(`Column already exists: leads.${col.name}`);
      }
    }

    // ============================================================
    // 5. Create accounts table
    // ============================================================
    await connection.query(`SET FOREIGN_KEY_CHECKS=0`);
    await connection.query(`DROP TABLE IF EXISTS accounts`);
    await connection.query(`
      CREATE TABLE accounts (
        AccountId int NOT NULL AUTO_INCREMENT,
        AccountNumber varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
        AccountName varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
        Phone varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        Website varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        Industry varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        AnnualRevenue decimal(15,2) DEFAULT NULL,
        NumberOfEmployees int DEFAULT NULL,
        BillingStreet text COLLATE utf8mb4_unicode_ci,
        BillingCity varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        BillingState varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        BillingCountry varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        BillingZip varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        ShippingStreet text COLLATE utf8mb4_unicode_ci,
        ShippingCity varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        ShippingState varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        ShippingCountry varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        ShippingZip varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        Description text COLLATE utf8mb4_unicode_ci,
        IsActive tinyint(1) DEFAULT '1',
        IsDeleted tinyint(1) DEFAULT '0',
        CreatedBy int DEFAULT NULL,
        UpdatedBy int DEFAULT NULL,
        CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (AccountId),
        UNIQUE KEY UQ_accounts_number (AccountNumber),
        KEY idx_accounts_name (AccountName),
        KEY idx_accounts_deleted (IsDeleted),
        KEY idx_accounts_active (IsActive),
        KEY fk_accounts_created_by (CreatedBy),
        KEY fk_accounts_updated_by (UpdatedBy),
        CONSTRAINT fk_accounts_created_by FOREIGN KEY (CreatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_accounts_updated_by FOREIGN KEY (UpdatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Created table: accounts');

    // ============================================================
    // 6. Create contacts table
    // ============================================================
    await connection.query(`DROP TABLE IF EXISTS contacts`);
    await connection.query(`
      CREATE TABLE contacts (
        ContactId int NOT NULL AUTO_INCREMENT,
        ContactNumber varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
        FirstName varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        LastName varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        Email varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        Phone varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        Mobile varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        Department varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        Title varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        AccountId int DEFAULT NULL,
        LeadSource varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        MailingStreet text COLLATE utf8mb4_unicode_ci,
        MailingCity varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        MailingState varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        MailingCountry varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        MailingZip varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        Description text COLLATE utf8mb4_unicode_ci,
        IsActive tinyint(1) DEFAULT '1',
        IsDeleted tinyint(1) DEFAULT '0',
        CreatedBy int DEFAULT NULL,
        UpdatedBy int DEFAULT NULL,
        CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (ContactId),
        UNIQUE KEY UQ_contacts_number (ContactNumber),
        KEY idx_contacts_lastname (LastName),
        KEY idx_contacts_account (AccountId),
        KEY idx_contacts_email (Email),
        KEY idx_contacts_deleted (IsDeleted),
        KEY idx_contacts_active (IsActive),
        KEY fk_contacts_created_by (CreatedBy),
        KEY fk_contacts_updated_by (UpdatedBy),
        CONSTRAINT fk_contacts_account FOREIGN KEY (AccountId) REFERENCES accounts (AccountId) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_contacts_created_by FOREIGN KEY (CreatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_contacts_updated_by FOREIGN KEY (UpdatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Created table: contacts');

    // ============================================================
    // 7. Create dealstage table
    // ============================================================
    await connection.query(`DROP TABLE IF EXISTS dealstage`);
    await connection.query(`
      CREATE TABLE dealstage (
        DealStageId int NOT NULL AUTO_INCREMENT,
        StageName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
        Probability int DEFAULT 0,
        DisplayOrder int DEFAULT 0,
        IsActive tinyint(1) DEFAULT 1,
        PRIMARY KEY (DealStageId),
        UNIQUE KEY UQ_dealstage_name (StageName),
        CONSTRAINT dealstage_chk_probability CHECK (Probability BETWEEN 0 AND 100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const dealStages = [
      ['Qualification', 10, 1],
      ['Needs Analysis', 20, 2],
      ['Value Proposition', 40, 3],
      ['Proposal / Price Quote', 60, 4],
      ['Negotiation / Review', 80, 5],
      ['Closed Won', 100, 6],
      ['Closed Lost', 0, 7]
    ];
    for (const [name, prob, order] of dealStages) {
      await connection.query(`INSERT INTO dealstage (StageName, Probability, DisplayOrder) VALUES (?, ?, ?)`, [name, prob, order]);
    }
    console.log('Created table: dealstage with stages');

    // ============================================================
    // 8. Create deals table
    // ============================================================
    await connection.query(`DROP TABLE IF EXISTS deals`);
    await connection.query(`
      CREATE TABLE deals (
        DealId int NOT NULL AUTO_INCREMENT,
        DealNumber varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
        DealName varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
        DealStageId int NOT NULL,
        ClosingDate date NOT NULL,
        AccountId int DEFAULT NULL,
        ContactId int DEFAULT NULL,
        Amount decimal(15,2) DEFAULT NULL,
        Probability int DEFAULT NULL,
        DealType varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        LeadSource varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        ExpectedRevenue decimal(15,2) DEFAULT NULL,
        Description text COLLATE utf8mb4_unicode_ci,
        LostReason text COLLATE utf8mb4_unicode_ci,
        AssignedToUserId int DEFAULT NULL,
        IsDeleted tinyint(1) DEFAULT 0,
        CreatedBy int DEFAULT NULL,
        UpdatedBy int DEFAULT NULL,
        CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (DealId),
        UNIQUE KEY UQ_deals_number (DealNumber),
        KEY idx_deals_stage (DealStageId),
        KEY idx_deals_account (AccountId),
        KEY idx_deals_contact (ContactId),
        KEY idx_deals_closing (ClosingDate),
        KEY idx_deals_deleted (IsDeleted),
        KEY idx_deals_assigned (AssignedToUserId),
        KEY fk_deals_created_by (CreatedBy),
        KEY fk_deals_updated_by (UpdatedBy),
        CONSTRAINT fk_deals_stage FOREIGN KEY (DealStageId) REFERENCES dealstage (DealStageId) ON UPDATE CASCADE,
        CONSTRAINT fk_deals_account FOREIGN KEY (AccountId) REFERENCES accounts (AccountId) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_deals_contact FOREIGN KEY (ContactId) REFERENCES contacts (ContactId) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_deals_assigned FOREIGN KEY (AssignedToUserId) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_deals_created_by FOREIGN KEY (CreatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_deals_updated_by FOREIGN KEY (UpdatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT deals_chk_probability CHECK (Probability BETWEEN 0 AND 100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Created table: deals');

    // ============================================================
    // 9. Add FK constraints to leads (for converted records)
    // ============================================================
    // First drop existing ones if they exist
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      AND CONSTRAINT_NAME IN ('fk_leads_converted_account','fk_leads_converted_contact','fk_leads_converted_deal')
    `);
    for (const c of constraints) {
      await connection.query(`ALTER TABLE leads DROP FOREIGN KEY \`${c.CONSTRAINT_NAME}\``);
    }

    // Drop existing indexes if present
    const [indexes] = await connection.query(`SHOW INDEX FROM leads`);
    const existingIndexes = indexes.map(i => i.Key_name);
    const idxToAdd = ['idx_leads_converted_account', 'idx_leads_converted_contact', 'idx_leads_converted_deal'];
    for (const idx of idxToAdd) {
      if (!existingIndexes.includes(idx)) {
        const colMap = {
          'idx_leads_converted_account': 'ConvertedAccountId',
          'idx_leads_converted_contact': 'ConvertedContactId',
          'idx_leads_converted_deal': 'ConvertedDealId'
        };
        await connection.query(`ALTER TABLE leads ADD KEY \`${idx}\` (\`${colMap[idx]}\`)`);
      }
    }

    await connection.query(`
      ALTER TABLE leads
        ADD CONSTRAINT fk_leads_converted_account FOREIGN KEY (ConvertedAccountId) REFERENCES accounts (AccountId) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT fk_leads_converted_contact FOREIGN KEY (ConvertedContactId) REFERENCES contacts (ContactId) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT fk_leads_converted_deal FOREIGN KEY (ConvertedDealId) REFERENCES deals (DealId) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('Added FK constraints to leads for converted records');

    await connection.query(`SET FOREIGN_KEY_CHECKS=1`);

    // ============================================================
    // Final verification
    // ============================================================
    const [finalTables] = await connection.query(`SHOW TABLES`);
    console.log('\n=== Final Tables ===');
    finalTables.forEach(t => console.log(' -', Object.values(t)[0]));

    const [finalStatuses] = await connection.query(`SELECT StatusName FROM leadstatus ORDER BY LeadStatusId`);
    console.log('\n=== Lead Statuses ===');
    finalStatuses.forEach(s => console.log(' -', s.StatusName));

    const [finalStages] = await connection.query(`SELECT StageName, Probability FROM dealstage ORDER BY DisplayOrder`);
    console.log('\n=== Deal Stages ===');
    finalStages.forEach(s => console.log(` - ${s.StageName} (${s.Probability}%)`));

    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
