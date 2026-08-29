-- ============================================================
-- CRM MODULE MIGRATION: Leads (update) + Accounts + Contacts + Deals
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. DROP deprecated tables
-- ============================================================
DROP TABLE IF EXISTS `leadqualification`;
DROP TABLE IF EXISTS `leadbusinessinfo`;
DROP TABLE IF EXISTS `opportunity`;
DROP TABLE IF EXISTS `opportunitystatus`;
DROP TABLE IF EXISTS `qualificationstatus`;

-- ============================================================
-- 2. Update LeadStatus values (exact per spec)
-- ============================================================
TRUNCATE TABLE `leadstatus`;
INSERT INTO `leadstatus` (`StatusName`, `Description`) VALUES
  ('New', 'Newly created lead'),
  ('Attempted to Contact', 'Contact attempt was made but no response'),
  ('Contacted', 'Lead was successfully contacted'),
  ('Qualified', 'Lead is qualified and ready for conversion'),
  ('Unqualified', 'Lead does not meet qualification criteria'),
  ('Junk Lead', 'Invalid, duplicate or spam lead');

-- ============================================================
-- 3. Add new columns to leads table
-- ============================================================
ALTER TABLE `leads`
  ADD COLUMN `FirstName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `LeadNumber`,
  ADD COLUMN `LastName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `FirstName`,
  ADD COLUMN `Mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `AlternatePhone`,
  ADD COLUMN `AnnualRevenue` decimal(15,2) DEFAULT NULL AFTER `Industry`,
  ADD COLUMN `Rating` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `AnnualRevenue`,
  ADD COLUMN `IsConverted` tinyint(1) DEFAULT '0' AFTER `IsActive`,
  ADD COLUMN `ConvertedAt` datetime DEFAULT NULL AFTER `IsConverted`,
  ADD COLUMN `ConvertedAccountId` int DEFAULT NULL AFTER `ConvertedAt`,
  ADD COLUMN `ConvertedContactId` int DEFAULT NULL AFTER `ConvertedAccountId`,
  ADD COLUMN `ConvertedDealId` int DEFAULT NULL AFTER `ConvertedContactId`;

-- ============================================================
-- 4. Create accounts table
-- ============================================================
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `AccountId` int NOT NULL AUTO_INCREMENT,
  `AccountNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `AccountName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Industry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AnnualRevenue` decimal(15,2) DEFAULT NULL,
  `NumberOfEmployees` int DEFAULT NULL,
  `BillingStreet` text COLLATE utf8mb4_unicode_ci,
  `BillingCity` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BillingState` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BillingCountry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BillingZip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ShippingStreet` text COLLATE utf8mb4_unicode_ci,
  `ShippingCity` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ShippingState` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ShippingCountry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ShippingZip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AccountId`),
  UNIQUE KEY `UQ_accounts_number` (`AccountNumber`),
  KEY `idx_accounts_name` (`AccountName`),
  KEY `idx_accounts_deleted` (`IsDeleted`),
  KEY `idx_accounts_active` (`IsActive`),
  KEY `fk_accounts_created_by` (`CreatedBy`),
  KEY `fk_accounts_updated_by` (`UpdatedBy`),
  CONSTRAINT `fk_accounts_created_by` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_accounts_updated_by` FOREIGN KEY (`UpdatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Create contacts table
-- ============================================================
DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
  `ContactId` int NOT NULL AUTO_INCREMENT,
  `ContactNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FirstName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LastName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AccountId` int DEFAULT NULL,
  `LeadSource` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MailingStreet` text COLLATE utf8mb4_unicode_ci,
  `MailingCity` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MailingState` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MailingCountry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MailingZip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ContactId`),
  UNIQUE KEY `UQ_contacts_number` (`ContactNumber`),
  KEY `idx_contacts_lastname` (`LastName`),
  KEY `idx_contacts_account` (`AccountId`),
  KEY `idx_contacts_email` (`Email`),
  KEY `idx_contacts_deleted` (`IsDeleted`),
  KEY `idx_contacts_active` (`IsActive`),
  KEY `fk_contacts_created_by` (`CreatedBy`),
  KEY `fk_contacts_updated_by` (`UpdatedBy`),
  CONSTRAINT `fk_contacts_account` FOREIGN KEY (`AccountId`) REFERENCES `accounts` (`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_contacts_created_by` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_contacts_updated_by` FOREIGN KEY (`UpdatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. Create dealstage table
-- ============================================================
DROP TABLE IF EXISTS `dealstage`;
CREATE TABLE `dealstage` (
  `DealStageId` int NOT NULL AUTO_INCREMENT,
  `StageName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Probability` int DEFAULT '0',
  `DisplayOrder` int DEFAULT '0',
  `IsActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`DealStageId`),
  UNIQUE KEY `UQ_dealstage_name` (`StageName`),
  CONSTRAINT `dealstage_chk_probability` CHECK ((`Probability` BETWEEN 0 AND 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `dealstage` (`StageName`, `Probability`, `DisplayOrder`) VALUES
  ('Qualification', 10, 1),
  ('Needs Analysis', 20, 2),
  ('Value Proposition', 40, 3),
  ('Proposal / Price Quote', 60, 4),
  ('Negotiation / Review', 80, 5),
  ('Closed Won', 100, 6),
  ('Closed Lost', 0, 7);

-- ============================================================
-- 7. Create deals table
-- ============================================================
DROP TABLE IF EXISTS `deals`;
CREATE TABLE `deals` (
  `DealId` int NOT NULL AUTO_INCREMENT,
  `DealNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DealName` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DealStageId` int NOT NULL,
  `ClosingDate` date NOT NULL,
  `AccountId` int DEFAULT NULL,
  `ContactId` int DEFAULT NULL,
  `Amount` decimal(15,2) DEFAULT NULL,
  `Probability` int DEFAULT NULL,
  `DealType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LeadSource` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ExpectedRevenue` decimal(15,2) DEFAULT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `LostReason` text COLLATE utf8mb4_unicode_ci,
  `AssignedToUserId` int DEFAULT NULL,
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`DealId`),
  UNIQUE KEY `UQ_deals_number` (`DealNumber`),
  KEY `idx_deals_stage` (`DealStageId`),
  KEY `idx_deals_account` (`AccountId`),
  KEY `idx_deals_contact` (`ContactId`),
  KEY `idx_deals_closing` (`ClosingDate`),
  KEY `idx_deals_deleted` (`IsDeleted`),
  KEY `idx_deals_assigned` (`AssignedToUserId`),
  KEY `fk_deals_created_by` (`CreatedBy`),
  KEY `fk_deals_updated_by` (`UpdatedBy`),
  CONSTRAINT `fk_deals_stage` FOREIGN KEY (`DealStageId`) REFERENCES `dealstage` (`DealStageId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_account` FOREIGN KEY (`AccountId`) REFERENCES `accounts` (`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_contact` FOREIGN KEY (`ContactId`) REFERENCES `contacts` (`ContactId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_assigned` FOREIGN KEY (`AssignedToUserId`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_created_by` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_updated_by` FOREIGN KEY (`UpdatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `deals_chk_probability` CHECK ((`Probability` BETWEEN 0 AND 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. Add FK constraints to leads for converted records
-- ============================================================
ALTER TABLE `leads`
  ADD KEY `idx_leads_converted_account` (`ConvertedAccountId`),
  ADD KEY `idx_leads_converted_contact` (`ConvertedContactId`),
  ADD KEY `idx_leads_converted_deal` (`ConvertedDealId`),
  ADD CONSTRAINT `fk_leads_converted_account` FOREIGN KEY (`ConvertedAccountId`) REFERENCES `accounts` (`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_leads_converted_contact` FOREIGN KEY (`ConvertedContactId`) REFERENCES `contacts` (`ContactId`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_leads_converted_deal` FOREIGN KEY (`ConvertedDealId`) REFERENCES `deals` (`DealId`) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
