/**
 * migration_complete.js
 * ----------------------
 * Complete database migration + seed for the Sales CRM (MySQL 8).
 *
 * What it does (in order):
 *   1. Drops and re-creates ALL tables (fresh schema from schema.sql).
 *   2. Seeds every lookup / master table.
 *   3. Creates ONE default admin user (admin@email.com / Admin@123).
 *   4. Seeds July + August 2026 demo data (leads, deals, proposals).
 *
 * Run via package.json:
 *   npm run migrate
 *
 * NOTE: This is destructive - it drops all existing tables first.
 */

const crypto = require('crypto');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

const {
  LEAD_STATUS,
  DEAL_STAGE,
  PROPOSAL_STATUS,
  APPOINTMENT_STATUS,
  ACTIVITY_TYPE,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  ROLES
} = require('../src/config/constants');

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
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME || 'salescrmv1',
  port: Number(process.env.DB_PORT || 3306),
  multipleStatements: true
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

/* ------------------------------------------------------------------ *
 * 1. SCHEMA - full table definitions (aligned with schema.sql)
 * ------------------------------------------------------------------ */
const SCHEMA_SQL = `
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DROP TABLE IF EXISTS proposalappointment;
DROP TABLE IF EXISTS activitylog;
DROP TABLE IF EXISTS leadfollowup;
DROP TABLE IF EXISTS auditlog;
DROP TABLE IF EXISTS lostorder;
DROP TABLE IF EXISTS salesorder;
DROP TABLE IF EXISTS proposal;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS appointment;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS appointmentstatus;
DROP TABLE IF EXISTS activitytype;
DROP TABLE IF EXISTS dealstage;
DROP TABLE IF EXISTS deliverystatus;
DROP TABLE IF EXISTS lead_followup_type;
DROP TABLE IF EXISTS lead_service_required;
DROP TABLE IF EXISTS leadsource;
DROP TABLE IF EXISTS leadstatus;
DROP TABLE IF EXISTS leadtype;
DROP TABLE IF EXISTS proposalstatus;
DROP TABLE IF EXISTS paymentstatus;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS userrole;

CREATE TABLE userrole (
  RoleId int NOT NULL AUTO_INCREMENT,
  RoleName varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Description text COLLATE utf8mb4_unicode_ci,
  IsActive tinyint(1) DEFAULT '1',
  PRIMARY KEY (RoleId),
  UNIQUE KEY RoleName (RoleName),
  UNIQUE KEY UQ_userrole_rolename (RoleName)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  UserId int NOT NULL AUTO_INCREMENT,
  Name varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  Email varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  Password varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  IsActive tinyint(1) DEFAULT '1',
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CreatedBy int DEFAULT NULL,
  UpdatedBy int DEFAULT NULL,
  RoleId int DEFAULT NULL,
  PRIMARY KEY (UserId),
  UNIQUE KEY Email (Email),
  UNIQUE KEY UQ_users_email (Email),
  KEY idx_users_active (IsActive),
  KEY idx_users_email (Email),
  KEY idx_users_deleted (IsDeleted),
  KEY fk_users_role (RoleId),
  CONSTRAINT fk_users_role FOREIGN KEY (RoleId) REFERENCES userrole (RoleId)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accounts (
  AccountId int NOT NULL AUTO_INCREMENT,
  AccountNumber varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  AccountName varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Phone varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Website varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Industry varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AnnualRevenue decimal(15,2) DEFAULT NULL,
  NumberOfEmployees int DEFAULT NULL,
  BillingStreet text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  BillingCity varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  BillingState varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  BillingCountry varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  BillingZip varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ShippingStreet text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  ShippingCity varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ShippingState varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ShippingCountry varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ShippingZip varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Description text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contacts (
  ContactId int NOT NULL AUTO_INCREMENT,
  ContactNumber varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  FirstName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  LastName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Email varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Phone varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Mobile varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Department varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Title varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AccountId int DEFAULT NULL,
  LeadSource varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MailingStreet text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  MailingCity varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MailingState varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MailingCountry varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MailingZip varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Description text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IsActive tinyint(1) DEFAULT '1',
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedBy int DEFAULT NULL,
  UpdatedBy int DEFAULT NULL,
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ContactId),
  UNIQUE KEY UQ_contacts_number (ContactNumber),
  UNIQUE KEY UQ_contacts_email (Email),
  UNIQUE KEY UQ_contacts_mobile (Mobile),
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dealstage (
  DealStageId int NOT NULL AUTO_INCREMENT,
  StageName varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Probability int DEFAULT '0',
  DisplayOrder int DEFAULT '0',
  Description text COLLATE utf8mb4_unicode_ci,
  IsActive tinyint(1) DEFAULT '1',
  PRIMARY KEY (DealStageId),
  UNIQUE KEY UQ_dealstage_name (StageName),
  CONSTRAINT dealstage_chk_probability CHECK (Probability between 0 and 100)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deals (
  DealId int NOT NULL AUTO_INCREMENT,
  DealNumber varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DealName varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DealStageId int NOT NULL,
  ClosingDate date NOT NULL,
  AccountId int DEFAULT NULL,
  ContactId int DEFAULT NULL,
  Amount decimal(15,2) DEFAULT NULL,
  Probability int DEFAULT NULL,
  DealType varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  LeadSource varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ExpectedRevenue decimal(15,2) DEFAULT NULL,
  Description text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  LostReason text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  AssignedToUserId int DEFAULT NULL,
  IsDeleted tinyint(1) DEFAULT '0',
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
  CONSTRAINT fk_deals_account FOREIGN KEY (AccountId) REFERENCES accounts (AccountId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_deals_assigned FOREIGN KEY (AssignedToUserId) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_deals_contact FOREIGN KEY (ContactId) REFERENCES contacts (ContactId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_deals_created_by FOREIGN KEY (CreatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_deals_stage FOREIGN KEY (DealStageId) REFERENCES dealstage (DealStageId) ON UPDATE CASCADE,
  CONSTRAINT fk_deals_updated_by FOREIGN KEY (UpdatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT deals_chk_probability CHECK (Probability between 0 and 100)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leadsource (
  SourceId int NOT NULL AUTO_INCREMENT,
  SourceName varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  Description text COLLATE utf8mb4_unicode_ci,
  IsActive tinyint(1) DEFAULT '1',
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  SourceType varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (SourceId),
  UNIQUE KEY SourceName (SourceName),
  UNIQUE KEY UQ_leadsource_sourcename (SourceName),
  KEY idx_source_active (IsActive),
  KEY idx_source_deleted (IsDeleted)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leadstatus (
  LeadStatusId int NOT NULL AUTO_INCREMENT,
  StatusName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  Description text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (LeadStatusId),
  UNIQUE KEY StatusName (StatusName),
  UNIQUE KEY UQ_leadstatus_statusname (StatusName)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leadtype (
  LeadTypeId int NOT NULL AUTO_INCREMENT,
  TypeName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  Description text COLLATE utf8mb4_unicode_ci,
  Priority int DEFAULT '0',
  IsActive tinyint(1) DEFAULT '1',
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (LeadTypeId),
  UNIQUE KEY TypeName (TypeName),
  UNIQUE KEY UQ_leadtype_typename (TypeName),
  KEY idx_leadtype_active (IsActive),
  KEY idx_leadtype_priority (Priority),
  KEY idx_leadtype_deleted (IsDeleted)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lead_service_required (
  ServiceRequiredId int NOT NULL AUTO_INCREMENT,
  ServiceName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Description text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IsActive tinyint(1) DEFAULT '1',
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ServiceRequiredId),
  UNIQUE KEY UQ_lead_service_required_name (ServiceName),
  KEY idx_lsr_active (IsActive),
  KEY idx_lsr_deleted (IsDeleted)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lead_followup_type (
  FollowUpTypeId int NOT NULL AUTO_INCREMENT,
  TypeName varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Description text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IsActive tinyint(1) DEFAULT '1',
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (FollowUpTypeId),
  UNIQUE KEY UQ_lead_followup_type_name (TypeName),
  KEY idx_lft_active (IsActive),
  KEY idx_lft_deleted (IsDeleted)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leads (
  LeadId int NOT NULL AUTO_INCREMENT,
  LeadNumber varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  FirstName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  LastName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Email varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Phone varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AlternatePhone varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Mobile varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  CompanyName varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Industry varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AnnualRevenue decimal(15,2) DEFAULT NULL,
  Rating varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Designation varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Country varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'India',
  State varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  City varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Address text COLLATE utf8mb4_unicode_ci,
  SourceId int NOT NULL,
  LeadTypeId int NOT NULL,
  AssignedToUserId int DEFAULT NULL,
  AssignedBy int DEFAULT NULL,
  AssignedAt datetime DEFAULT NULL,
  IsActive tinyint(1) DEFAULT '1',
  IsConverted tinyint(1) DEFAULT '0',
  ConvertedAt datetime DEFAULT NULL,
  ConvertedAccountId int DEFAULT NULL,
  ConvertedContactId int DEFAULT NULL,
  ConvertedDealId int DEFAULT NULL,
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CreatedBy int DEFAULT NULL,
  UpdatedBy int DEFAULT NULL,
  LeadStatusId int DEFAULT NULL,
  ServiceRequiredId int DEFAULT NULL,
  EstimatedValue decimal(15,2) DEFAULT NULL,
  Remarks text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (LeadId),
  UNIQUE KEY LeadNumber (LeadNumber),
  UNIQUE KEY UQ_leads_leadnumber (LeadNumber),
  UNIQUE KEY uk_leads_email (Email),
  KEY fk_leads_assigned_by (AssignedBy),
  KEY fk_leads_created_by (CreatedBy),
  KEY idx_leads_number (LeadNumber),
  KEY idx_leads_created (CreatedAt),
  KEY idx_leads_assigned_user (AssignedToUserId),
  KEY idx_leads_source (SourceId),
  KEY idx_leads_type (LeadTypeId),
  KEY idx_leads_email (Email),
  KEY idx_leads_phone (Phone),
  KEY idx_leads_company (CompanyName),
  KEY idx_leads_deleted (IsDeleted),
  KEY idx_leads_active (IsActive),
  KEY fk_leads_status (LeadStatusId),
  KEY idx_leads_converted_account (ConvertedAccountId),
  KEY idx_leads_converted_contact (ConvertedContactId),
  KEY idx_leads_converted_deal (ConvertedDealId),
  KEY idx_leads_service_required (ServiceRequiredId),
  CONSTRAINT fk_leads_assigned_by FOREIGN KEY (AssignedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_assigned_user FOREIGN KEY (AssignedToUserId) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_converted_account FOREIGN KEY (ConvertedAccountId) REFERENCES accounts (AccountId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_converted_contact FOREIGN KEY (ConvertedContactId) REFERENCES contacts (ContactId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_converted_deal FOREIGN KEY (ConvertedDealId) REFERENCES deals (DealId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_created_by FOREIGN KEY (CreatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_service_required FOREIGN KEY (ServiceRequiredId) REFERENCES lead_service_required (ServiceRequiredId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_source FOREIGN KEY (SourceId) REFERENCES leadsource (SourceId) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_leads_status FOREIGN KEY (LeadStatusId) REFERENCES leadstatus (LeadStatusId),
  CONSTRAINT fk_leads_type FOREIGN KEY (LeadTypeId) REFERENCES leadtype (LeadTypeId) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leadfollowup (
  FollowUpId int NOT NULL AUTO_INCREMENT,
  LeadId int NOT NULL,
  FollowUpDate datetime NOT NULL,
  FollowUpTypeId int NOT NULL,
  Remarks text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  NextFollowUpDate datetime DEFAULT NULL,
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedByUserId int DEFAULT NULL,
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (FollowUpId),
  KEY idx_followup_lead (LeadId),
  KEY idx_followup_type (FollowUpTypeId),
  KEY idx_followup_date (FollowUpDate),
  KEY idx_followup_nextdate (NextFollowUpDate),
  KEY idx_followup_deleted (IsDeleted),
  KEY fk_followup_creator (CreatedByUserId),
  CONSTRAINT fk_followup_creator FOREIGN KEY (CreatedByUserId) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_followup_lead FOREIGN KEY (LeadId) REFERENCES leads (LeadId) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_followup_type FOREIGN KEY (FollowUpTypeId) REFERENCES lead_followup_type (FollowUpTypeId) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointmentstatus (
  AppointmentStatusId int NOT NULL AUTO_INCREMENT,
  StatusName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (AppointmentStatusId),
  UNIQUE KEY StatusName (StatusName),
  UNIQUE KEY UQ_appointmentstatus_statusname (StatusName)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activitytype (
  ActivityTypeId int NOT NULL AUTO_INCREMENT,
  TypeName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (ActivityTypeId),
  UNIQUE KEY TypeName (TypeName),
  UNIQUE KEY UQ_activitytype_typename (TypeName)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointment (
  AppointmentId int NOT NULL AUTO_INCREMENT,
  AppointmentNumber varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  LeadId int DEFAULT NULL,
  ContactId int DEFAULT NULL,
  AccountId int DEFAULT NULL,
  DealId int DEFAULT NULL,
  Title varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  StartDateTime datetime NOT NULL,
  EndDateTime datetime DEFAULT NULL,
  Duration int DEFAULT NULL,
  Mode varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Location varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MeetingLink varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Agenda text COLLATE utf8mb4_unicode_ci,
  MeetingNotes text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  AttendeesList json DEFAULT NULL,
  ReminderEnabled tinyint(1) DEFAULT '0',
  ReminderMinutesBefore int DEFAULT NULL,
  CreatedByUserId int NOT NULL,
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  AppointmentStatusId int DEFAULT NULL,
  Outcome varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  NextFollowUpDate datetime DEFAULT NULL,
  FollowUpNotes text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (AppointmentId),
  UNIQUE KEY UQ_appointment_appointmentnumber (AppointmentNumber),
  KEY fk_appointment_creator (CreatedByUserId),
  KEY idx_appointment_number (AppointmentNumber),
  KEY idx_appointment_date (StartDateTime),
  KEY idx_appointment_lead (LeadId),
  KEY idx_appointment_deleted (IsDeleted),
  KEY fk_appointment_status (AppointmentStatusId),
  KEY idx_appointment_contact (ContactId),
  KEY idx_appointment_account (AccountId),
  KEY idx_appointment_deal (DealId),
  CONSTRAINT fk_appointment_account FOREIGN KEY (AccountId) REFERENCES accounts (AccountId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_appointment_contact FOREIGN KEY (ContactId) REFERENCES contacts (ContactId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_appointment_creator FOREIGN KEY (CreatedByUserId) REFERENCES users (UserId) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_appointment_deal FOREIGN KEY (DealId) REFERENCES deals (DealId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_appointment_lead FOREIGN KEY (LeadId) REFERENCES leads (LeadId) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_appointment_status FOREIGN KEY (AppointmentStatusId) REFERENCES appointmentstatus (AppointmentStatusId)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deliverystatus (
  DeliveryStatusId int NOT NULL AUTO_INCREMENT,
  StatusName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (DeliveryStatusId),
  UNIQUE KEY StatusName (StatusName),
  UNIQUE KEY UQ_deliverystatus_statusname (StatusName)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE paymentstatus (
  PaymentStatusId int NOT NULL AUTO_INCREMENT,
  StatusName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (PaymentStatusId),
  UNIQUE KEY StatusName (StatusName),
  UNIQUE KEY UQ_paymentstatus_statusname (StatusName)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proposalstatus (
  ProposalStatusId int NOT NULL AUTO_INCREMENT,
  StatusName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (ProposalStatusId),
  UNIQUE KEY StatusName (StatusName),
  UNIQUE KEY UQ_proposalstatus_statusname (StatusName)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proposal (
  ProposalId int NOT NULL AUTO_INCREMENT,
  ProposalNumber varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  DealId int NOT NULL,
  ProposalTitle varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  ProposalAmount decimal(15,2) NOT NULL,
  Currency varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  ProposalDocumentPath varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  VersionNo int DEFAULT '1',
  ParentProposalId int DEFAULT NULL,
  ValidityDate date DEFAULT NULL,
  PaymentTerms text COLLATE utf8mb4_unicode_ci,
  DeliveryTerms text COLLATE utf8mb4_unicode_ci,
  SubmittedAt datetime DEFAULT NULL,
  ApprovedByUserId int DEFAULT NULL,
  ApprovedAt datetime DEFAULT NULL,
  RejectedAt datetime DEFAULT NULL,
  RejectionReason text COLLATE utf8mb4_unicode_ci,
  DecisionDate datetime DEFAULT NULL,
  InternalNotes text COLLATE utf8mb4_unicode_ci,
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CreatedBy int DEFAULT NULL,
  ProposalStatusId int DEFAULT NULL,
  ContentHash char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (ProposalId),
  UNIQUE KEY ProposalNumber (ProposalNumber),
  UNIQUE KEY UQ_proposal_proposalnumber (ProposalNumber),
  UNIQUE KEY uq_deal_content (DealId, ContentHash),
  UNIQUE KEY uq_deal_version (DealId, VersionNo),
  KEY fk_proposal_approvedby (ApprovedByUserId),
  KEY fk_proposal_created_by (CreatedBy),
  KEY idx_proposal_number (ProposalNumber),
  KEY idx_proposal_parent (ParentProposalId),
  KEY idx_proposal_submitted (SubmittedAt),
  KEY idx_proposal_deleted (IsDeleted),
  KEY fk_proposal_status (ProposalStatusId),
  KEY idx_proposal_deal (DealId),
  KEY idx_proposal_deal_version (DealId, VersionNo DESC),
  CONSTRAINT fk_proposal_approvedby FOREIGN KEY (ApprovedByUserId) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_created_by FOREIGN KEY (CreatedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_deal FOREIGN KEY (DealId) REFERENCES deals (DealId) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_parent FOREIGN KEY (ParentProposalId) REFERENCES proposal (ProposalId) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_status FOREIGN KEY (ProposalStatusId) REFERENCES proposalstatus (ProposalStatusId)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lostorder (
  LostOrderId int NOT NULL AUTO_INCREMENT,
  ProposalId int NOT NULL,
  Reason varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  DetailedFeedback text COLLATE utf8mb4_unicode_ci,
  CompetitorWon varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  LostDate datetime DEFAULT CURRENT_TIMESTAMP,
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (LostOrderId),
  UNIQUE KEY ProposalId (ProposalId),
  UNIQUE KEY UQ_lostorder_proposal (ProposalId),
  KEY idx_lostorder_date (LostDate),
  KEY idx_lostorder_reason (Reason),
  KEY idx_lostorder_deleted (IsDeleted),
  CONSTRAINT fk_lostorder_proposal FOREIGN KEY (ProposalId) REFERENCES proposal (ProposalId) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE salesorder (
  SalesOrderId int NOT NULL AUTO_INCREMENT,
  ProposalId int NOT NULL,
  OrderNumber varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  OrderDate datetime DEFAULT CURRENT_TIMESTAMP,
  OrderValue decimal(15,2) NOT NULL,
  Currency varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  ExpectedDeliveryDate date DEFAULT NULL,
  ActualDeliveryDate date DEFAULT NULL,
  PONumber varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PODocument varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  InvoiceGenerated tinyint(1) DEFAULT '0',
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PaymentStatusId int DEFAULT NULL,
  DeliveryStatusId int DEFAULT NULL,
  PRIMARY KEY (SalesOrderId),
  UNIQUE KEY ProposalId (ProposalId),
  UNIQUE KEY OrderNumber (OrderNumber),
  UNIQUE KEY UQ_salesorder_ordernumber (OrderNumber),
  KEY idx_salesorder_number (OrderNumber),
  KEY idx_salesorder_date (OrderDate),
  KEY idx_salesorder_deleted (IsDeleted),
  KEY fk_salesorder_payment (PaymentStatusId),
  KEY fk_salesorder_delivery (DeliveryStatusId),
  CONSTRAINT fk_salesorder_delivery FOREIGN KEY (DeliveryStatusId) REFERENCES deliverystatus (DeliveryStatusId),
  CONSTRAINT fk_salesorder_payment FOREIGN KEY (PaymentStatusId) REFERENCES paymentstatus (PaymentStatusId),
  CONSTRAINT fk_salesorder_proposal FOREIGN KEY (ProposalId) REFERENCES proposal (ProposalId) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activitylog (
  ActivityId int NOT NULL AUTO_INCREMENT,
  Subject varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Description text COLLATE utf8mb4_unicode_ci,
  Direction varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Duration int DEFAULT NULL,
  Outcome varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ActivityDate datetime DEFAULT CURRENT_TIMESTAMP,
  ScheduledFollowUp datetime DEFAULT NULL,
  Attachments json DEFAULT NULL,
  CreatedByUserId int NOT NULL,
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ActivityTypeId int DEFAULT NULL,
  AppointmentId int NOT NULL,
  PRIMARY KEY (ActivityId),
  KEY fk_activity_user (CreatedByUserId),
  KEY idx_activity_date (ActivityDate),
  KEY idx_activity_followup (ScheduledFollowUp),
  KEY idx_activity_deleted (IsDeleted),
  KEY fk_activity_type (ActivityTypeId),
  KEY idx_activity_appointment (AppointmentId),
  CONSTRAINT fk_activity_appointment FOREIGN KEY (AppointmentId) REFERENCES appointment (AppointmentId) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_activity_type FOREIGN KEY (ActivityTypeId) REFERENCES activitytype (ActivityTypeId),
  CONSTRAINT fk_activity_user FOREIGN KEY (CreatedByUserId) REFERENCES users (UserId) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditlog (
  AuditId bigint NOT NULL AUTO_INCREMENT,
  TableName varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  RecordId int NOT NULL,
  Action varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  OldValues json DEFAULT NULL,
  NewValues json DEFAULT NULL,
  ChangedBy int DEFAULT NULL,
  ChangedAt datetime DEFAULT CURRENT_TIMESTAMP,
  IPAddress varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  UserAgent text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (AuditId),
  KEY idx_audit_table (TableName),
  KEY idx_audit_record (RecordId),
  KEY idx_audit_action (Action),
  KEY idx_audit_date (ChangedAt),
  KEY idx_audit_user (ChangedBy),
  CONSTRAINT fk_audit_user FOREIGN KEY (ChangedBy) REFERENCES users (UserId) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proposalappointment (
  ProposalAppointmentId int NOT NULL AUTO_INCREMENT,
  ProposalId int NOT NULL,
  AppointmentId int NOT NULL,
  IsDeleted tinyint(1) DEFAULT '0',
  CreatedAt datetime DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ProposalAppointmentId),
  UNIQUE KEY uk_proposal_appointment (ProposalId, AppointmentId),
  UNIQUE KEY UQ_proposalappointment (ProposalId, AppointmentId),
  KEY idx_pa_proposal (ProposalId),
  KEY idx_pa_appointment (AppointmentId),
  KEY idx_pa_deleted (IsDeleted),
  CONSTRAINT fk_pa_appointment FOREIGN KEY (AppointmentId) REFERENCES appointment (AppointmentId) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pa_proposal FOREIGN KEY (ProposalId) REFERENCES proposal (ProposalId) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET UNIQUE_CHECKS = 1;
SET FOREIGN_KEY_CHECKS = 1;
`;

/* ------------------------------------------------------------------ *
 * 2. LOOKUP SEED - master data (values mirrored from constants.js)
 * ------------------------------------------------------------------ */
async function seedLookups(connection) {
  await connection.query(`
    INSERT INTO userrole (RoleId, RoleName, Description, IsActive) VALUES
      (${ROLES.ADMIN}, 'Admin', 'Full system administrator', 1),
      (${ROLES.SALES_MANAGER}, 'Sales Manager', 'Manages sales team', 1),
      (${ROLES.SALES_PERSON}, 'Sales Person', 'Handles leads, deals and clients', 1)
    ON DUPLICATE KEY UPDATE
      RoleName = VALUES(RoleName),
      Description = VALUES(Description),
      IsActive = 1
  `);

  await connection.query(`
    INSERT INTO leadstatus (LeadStatusId, StatusName, Description) VALUES
      (${LEAD_STATUS.NEW}, 'New', 'New lead'),
      (${LEAD_STATUS.ATTEMPTED_TO_CONTACT}, 'Attempted to Contact', 'Attempted to contact the lead'),
      (${LEAD_STATUS.CONTACTED}, 'Contacted', 'Contacted the lead'),
      (${LEAD_STATUS.QUALIFIED}, 'Qualified', 'Lead is qualified'),
      (${LEAD_STATUS.UNQUALIFIED}, 'Unqualified', 'Lead is not qualified'),
      (${LEAD_STATUS.JUNK_LEAD}, 'Junk Lead', 'Junk or low quality lead')
    ON DUPLICATE KEY UPDATE
      StatusName = VALUES(StatusName),
      Description = COALESCE(Description, VALUES(Description))
  `);

  await connection.query(`
    INSERT INTO leadsource (SourceId, SourceName, Description, IsActive, IsDeleted, SourceType) VALUES
      (1, 'Website', 'Website enquiries', 1, 0, 'Inbound'),
      (2, 'Referral', 'Referral enquiries', 1, 0, 'Inbound'),
      (3, 'Campaign', 'Campaign enquiries', 1, 0, 'Marketing'),
      (4, 'WhatsApp', 'WhatsApp / Inbound enquiries', 1, 0, 'Inbound'),
      (5, 'LinkedIn', 'LinkedIn / Social enquiries', 1, 0, 'Social'),
      (6, 'Google', 'Google / Inbound enquiries', 1, 0, 'Inbound'),
      (7, 'Facebook', 'Facebook / Social enquiries', 1, 0, 'Social'),
      (8, 'Other', 'Other source', 1, 0, 'Other')
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
      (${DEAL_STAGE.QUALIFICATION}, 'Qualification', 10, 1, 'Initial qualification', 1),
      (${DEAL_STAGE.NEEDS_ANALYSIS}, 'Needs Analysis', 25, 2, 'Needs analysis', 1),
      (${DEAL_STAGE.VALUE_PROPOSITION}, 'Value Proposition', 40, 3, 'Value proposition', 1),
      (${DEAL_STAGE.PROPOSAL_QUOTE}, 'Proposal/Quote', 60, 4, 'Proposal or quote sent', 1),
      (${DEAL_STAGE.NEGOTIATION_REVIEW}, 'Negotiation/Review', 80, 5, 'Negotiation or review', 1),
      (${DEAL_STAGE.CLOSED_WON}, 'Closed Won', 100, 6, 'Closed won', 1),
      (${DEAL_STAGE.CLOSED_LOST}, 'Closed Lost', 0, 7, 'Closed lost', 1)
    ON DUPLICATE KEY UPDATE
      StageName = VALUES(StageName),
      Probability = VALUES(Probability),
      DisplayOrder = VALUES(DisplayOrder),
      IsActive = 1
  `);

  await connection.query(`
    INSERT INTO proposalstatus (ProposalStatusId, StatusName) VALUES
      (${PROPOSAL_STATUS.DRAFT}, 'Draft'),
      (${PROPOSAL_STATUS.SUBMITTED}, 'Submitted'),
      (${PROPOSAL_STATUS.UNDER_REVIEW}, 'Under Review'),
      (${PROPOSAL_STATUS.APPROVED}, 'Approved'),
      (${PROPOSAL_STATUS.REJECTED}, 'Rejected'),
      (${PROPOSAL_STATUS.EXPIRED}, 'Expired'),
      (${PROPOSAL_STATUS.REJECTED_EXPIRED}, 'Rejected Expired')
    ON DUPLICATE KEY UPDATE
      StatusName = VALUES(StatusName)
  `);

  await connection.query(`
    INSERT INTO appointmentstatus (AppointmentStatusId, StatusName) VALUES
      (${APPOINTMENT_STATUS.SCHEDULED}, 'Scheduled'),
      (${APPOINTMENT_STATUS.COMPLETED}, 'Completed'),
      (${APPOINTMENT_STATUS.CANCELLED}, 'Cancelled'),
      (${APPOINTMENT_STATUS.RESCHEDULED}, 'Rescheduled')
    ON DUPLICATE KEY UPDATE
      StatusName = VALUES(StatusName)
  `);

  await connection.query(`
    INSERT INTO activitytype (ActivityTypeId, TypeName) VALUES
      (${ACTIVITY_TYPE.CALL}, 'Call'),
      (${ACTIVITY_TYPE.EMAIL}, 'Email'),
      (${ACTIVITY_TYPE.MEETING}, 'Meeting'),
      (${ACTIVITY_TYPE.NOTE}, 'Note'),
      (${ACTIVITY_TYPE.TASK}, 'Task')
    ON DUPLICATE KEY UPDATE
      TypeName = VALUES(TypeName)
  `);

  await connection.query(`
    INSERT INTO paymentstatus (PaymentStatusId, StatusName) VALUES
      (${PAYMENT_STATUS.PENDING}, 'Pending'),
      (${PAYMENT_STATUS.PARTIAL}, 'Partial'),
      (${PAYMENT_STATUS.PAID}, 'Paid'),
      (${PAYMENT_STATUS.OVERDUE}, 'Overdue')
    ON DUPLICATE KEY UPDATE
      StatusName = VALUES(StatusName)
  `);

  await connection.query(`
    INSERT INTO deliverystatus (DeliveryStatusId, StatusName) VALUES
      (${DELIVERY_STATUS.PENDING}, 'Pending'),
      (${DELIVERY_STATUS.IN_PROGRESS}, 'In Progress'),
      (${DELIVERY_STATUS.DELIVERED}, 'Delivered'),
      (${DELIVERY_STATUS.DELAYED}, 'Delayed')
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

/* ------------------------------------------------------------------ *
 * 3. DEFAULT ADMIN USER
 * ------------------------------------------------------------------ */
async function seedAdminUser(connection) {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const [result] = await connection.query(`
    INSERT INTO users (Name, Email, Password, IsActive, IsDeleted, RoleId, CreatedBy, UpdatedBy)
    VALUES ('Admin', 'admin@email.com', ?, 1, 0, ${ROLES.ADMIN}, NULL, NULL)
    ON DUPLICATE KEY UPDATE
      Name = VALUES(Name),
      Password = VALUES(Password),
      IsActive = 1,
      IsDeleted = 0,
      RoleId = VALUES(RoleId)
  `, [hashedPassword]);

  return result;
}

/* ------------------------------------------------------------------ *
 * 4. JULY / AUGUST 2026 DEMO DATA
 * ------------------------------------------------------------------ */
async function seedJulAug(connection, users) {
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

  // ---- Leads ----
  const leads = [];
  let seq = 0;
  for (const { year, month } of TARGET_MONTHS) {
    const monthLabel = `${year}${pad(month)}`;
    const config = MONTH_CONFIG[monthLabel];
    const owner = users[seq % users.length];

    const statuses = LEAD_STATUS_POOL.slice(0, config.leads);
    statuses[config.qualified - 1] = LEAD_STATUS.QUALIFIED;

    for (let i = 0; i < config.leads; i += 1) {
      const created = dayInMonth(year, month, 2 + i, 9 + (i % 4));
      const status = statuses[i];

      leads.push({
        LeadNumber: `${SEED_PREFIX}-LEAD-${monthLabel}-${pad(seq + 1)}`,
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

  // ---- Deals + Proposals ----
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

    for (let i = 0; i < config.openStages; i += 1) {
      const stage = OPEN_STAGES[i];
      dealSpecs.push({
        name: `${monthLabel} ${stage === DEAL_STAGE.NEGOTIATION_REVIEW ? 'Negotiation' : 'Pipeline'} Deal ${i + 1}`,
        stageId: stage,
        amount: 90000 + i * 60000 + (month === 8 ? 30000 : 0),
        probability: stage === DEAL_STAGE.QUALIFICATION ? 10 : stage === DEAL_STAGE.NEEDS_ANALYSIS ? 25 : stage === DEAL_STAGE.VALUE_PROPOSITION ? 40 : stage === DEAL_STAGE.PROPOSAL_QUOTE ? 60 : 80,
        monthIndex: TARGET_MONTHS.findIndex((m) => m.year === year && m.month === month),
        day: 4 + i * 2
      });
    }

    const wonAmounts = month === 8 ? [310000, 370000] : [420000];
    for (let i = 0; i < config.won; i += 1) {
      dealSpecs.push({
        name: `${monthLabel} Closed Won Deal ${i + 1}`,
        stageId: DEAL_STAGE.CLOSED_WON,
        amount: wonAmounts[i],
        probability: 100,
        monthIndex: TARGET_MONTHS.findIndex((m) => m.year === year && m.month === month),
        day: 20 + i * 2
      });
    }

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

  return { leads: leads.length, deals: dealSpecs.length, proposals: proposalsInserted };
}

/* ------------------------------------------------------------------ *
 * MAIN
 * ------------------------------------------------------------------ */
async function getUsers(connection) {
  const [users] = await connection.query(`
    SELECT UserId, Name
    FROM users
    WHERE IsDeleted = 0 AND IsActive = 1
    ORDER BY UserId
  `);

  if (users.length === 0) {
    throw new Error('No active users found after migration.');
  }

  return users;
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('Step 1/4: Creating schema (dropping existing tables)...');
    await connection.query(SCHEMA_SQL);
    console.log('  Schema created successfully.');

    console.log('Step 2/4: Seeding lookup / master data...');
    await seedLookups(connection);
    console.log('  Lookup data seeded.');

    console.log('Step 3/4: Creating default admin user...');
    const adminResult = await seedAdminUser(connection);
    console.log('  Admin user ready (admin@email.com / Admin@123).');
    if (adminResult.insertId) {
      console.log(`  Admin UserId = ${adminResult.insertId}`);
    }

    const users = await getUsers(connection);
    console.log(`  Active users available: ${users.map((u) => `${u.Name} (#${u.UserId})`).join(', ')}`);

    console.log('Step 4/4: Seeding July/August 2026 demo data...');
    const { leads, deals, proposals } = await seedJulAug(connection, users);
    console.log('  July/August demo data seeded.');

    console.log('--------------------------------------------');
    console.log('Migration completed successfully.');
    console.log(`Jul/Aug: ${leads} leads, ${deals} deals, ${proposals} proposals.`);
    console.log('Default login -> admin@email.com / Admin@123');
    console.log('--------------------------------------------');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
