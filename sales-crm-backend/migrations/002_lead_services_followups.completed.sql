-- ============================================================
-- MIGRATION: Lead Services & Follow-up Module
-- 1. lead_service_required lookup table
-- 2. lead_followup_type lookup table
-- 3. leads columns: ServiceRequiredId, EstimatedValue, Remarks
-- 4. leadfollowup table (1:N with leads)
-- 5. leadsource: append new source values
-- NOTE: leadstatus table is NOT modified.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. Create lead_service_required lookup table
-- ============================================================
CREATE TABLE IF NOT EXISTS `lead_service_required` (
  `ServiceRequiredId` int NOT NULL AUTO_INCREMENT,
  `ServiceName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ServiceRequiredId`),
  UNIQUE KEY `UQ_lead_service_required_name` (`ServiceName`),
  KEY `idx_lsr_active` (`IsActive`),
  KEY `idx_lsr_deleted` (`IsDeleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lead_service_required` (`ServiceName`, `Description`) VALUES
  ('Website Development', 'Website development service'),
  ('Web Application', 'Web application development service'),
  ('Mobile Application', 'Mobile application development service'),
  ('E-Commerce', 'E-Commerce development service'),
  ('SEO', 'Search Engine Optimization service'),
  ('Digital Marketing', 'Digital marketing service'),
  ('Other', 'Other service')
ON DUPLICATE KEY UPDATE
  `Description` = COALESCE(`Description`, VALUES(`Description`));

-- ============================================================
-- 2. Create lead_followup_type lookup table
-- ============================================================
CREATE TABLE IF NOT EXISTS `lead_followup_type` (
  `FollowUpTypeId` int NOT NULL AUTO_INCREMENT,
  `TypeName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`FollowUpTypeId`),
  UNIQUE KEY `UQ_lead_followup_type_name` (`TypeName`),
  KEY `idx_lft_active` (`IsActive`),
  KEY `idx_lft_deleted` (`IsDeleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lead_followup_type` (`TypeName`, `Description`) VALUES
  ('Phone Call', 'Phone call follow-up'),
  ('Email', 'Email follow-up'),
  ('Meeting', 'In-person or virtual meeting'),
  ('WhatsApp', 'WhatsApp follow-up'),
  ('Site Visit', 'On-site visit'),
  ('Other', 'Other follow-up type')
ON DUPLICATE KEY UPDATE
  `Description` = COALESCE(`Description`, VALUES(`Description`));

-- ============================================================
-- 3. Add columns to leads table (idempotent)
-- ============================================================
SET @hasCol = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'ServiceRequiredId');
SET @sql = IF(@hasCol = 0,
  'ALTER TABLE `leads` ADD COLUMN `ServiceRequiredId` int DEFAULT NULL AFTER `LeadStatusId`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @hasCol = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'EstimatedValue');
SET @sql = IF(@hasCol = 0,
  'ALTER TABLE `leads` ADD COLUMN `EstimatedValue` decimal(15,2) DEFAULT NULL AFTER `ServiceRequiredId`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @hasCol = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'Remarks');
SET @sql = IF(@hasCol = 0,
  'ALTER TABLE `leads` ADD COLUMN `Remarks` text COLLATE utf8mb4_unicode_ci AFTER `EstimatedValue`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add index + FK for ServiceRequiredId if not present
SET @hasIndex = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND INDEX_NAME = 'idx_leads_service_required'
);
SET @sql = IF(@hasIndex = 0,
  'ALTER TABLE `leads` ADD KEY `idx_leads_service_required` (`ServiceRequiredId`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @hasFk = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_leads_service_required'
);
SET @sql = IF(@hasFk = 0,
  'ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_service_required` FOREIGN KEY (`ServiceRequiredId`) REFERENCES `lead_service_required` (`ServiceRequiredId`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 4. Create leadfollowup table (1:N with leads)
-- ============================================================
CREATE TABLE IF NOT EXISTS `leadfollowup` (
  `FollowUpId` int NOT NULL AUTO_INCREMENT,
  `LeadId` int NOT NULL,
  `FollowUpDate` datetime NOT NULL,
  `FollowUpTypeId` int NOT NULL,
  `Remarks` text COLLATE utf8mb4_unicode_ci,
  `NextFollowUpDate` datetime DEFAULT NULL,
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedByUserId` int DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`FollowUpId`),
  KEY `idx_followup_lead` (`LeadId`),
  KEY `idx_followup_type` (`FollowUpTypeId`),
  KEY `idx_followup_date` (`FollowUpDate`),
  KEY `idx_followup_nextdate` (`NextFollowUpDate`),
  KEY `idx_followup_deleted` (`IsDeleted`),
  CONSTRAINT `fk_followup_lead` FOREIGN KEY (`LeadId`)
    REFERENCES `leads` (`LeadId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_followup_type` FOREIGN KEY (`FollowUpTypeId`)
    REFERENCES `lead_followup_type` (`FollowUpTypeId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_followup_creator` FOREIGN KEY (`CreatedByUserId`)
    REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Append new lead source values (existing rows untouched)
-- ============================================================
INSERT INTO `leadsource` (`SourceName`, `Description`, `IsActive`, `IsDeleted`, `SourceType`) VALUES
  ('WhatsApp', 'WhatsApp enquiries', 1, 0, 'Inbound'),
  ('LinkedIn', 'LinkedIn enquiries', 1, 0, 'Social'),
  ('Google', 'Google enquiries', 1, 0, 'Inbound'),
  ('Facebook', 'Facebook enquiries', 1, 0, 'Social'),
  ('Other', 'Other sources', 1, 0, 'Other')
ON DUPLICATE KEY UPDATE
  `Description` = COALESCE(`Description`, VALUES(`Description`)),
  `IsActive` = 1,
  `IsDeleted` = 0;

SET FOREIGN_KEY_CHECKS = 1;