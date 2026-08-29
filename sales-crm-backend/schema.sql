-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: salescrmv1
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `AccountId` int NOT NULL AUTO_INCREMENT,
  `AccountNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `AccountName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Industry` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AnnualRevenue` decimal(15,2) DEFAULT NULL,
  `NumberOfEmployees` int DEFAULT NULL,
  `BillingStreet` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `BillingCity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BillingState` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BillingCountry` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BillingZip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ShippingStreet` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ShippingCity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ShippingState` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ShippingCountry` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ShippingZip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activitylog`
--

DROP TABLE IF EXISTS `activitylog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activitylog` (
  `ActivityId` int NOT NULL AUTO_INCREMENT,
  `Subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `Direction` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Duration` int DEFAULT NULL,
  `Outcome` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ActivityDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `ScheduledFollowUp` datetime DEFAULT NULL,
  `Attachments` json DEFAULT NULL,
  `CreatedByUserId` int NOT NULL,
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ActivityTypeId` int DEFAULT NULL,
  `AppointmentId` int NOT NULL,
  PRIMARY KEY (`ActivityId`),
  KEY `fk_activity_user` (`CreatedByUserId`),
  KEY `idx_activity_date` (`ActivityDate`),
  KEY `idx_activity_followup` (`ScheduledFollowUp`),
  KEY `idx_activity_deleted` (`IsDeleted`),
  KEY `fk_activity_type` (`ActivityTypeId`),
  KEY `idx_activity_appointment` (`AppointmentId`),
  CONSTRAINT `fk_activity_appointment` FOREIGN KEY (`AppointmentId`) REFERENCES `appointment` (`AppointmentId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_activity_type` FOREIGN KEY (`ActivityTypeId`) REFERENCES `activitytype` (`ActivityTypeId`),
  CONSTRAINT `fk_activity_user` FOREIGN KEY (`CreatedByUserId`) REFERENCES `users` (`UserId`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activitytype`
--

DROP TABLE IF EXISTS `activitytype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activitytype` (
  `ActivityTypeId` int NOT NULL AUTO_INCREMENT,
  `TypeName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ActivityTypeId`),
  UNIQUE KEY `TypeName` (`TypeName`),
  UNIQUE KEY `UQ_activitytype_typename` (`TypeName`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment` (
  `AppointmentId` int NOT NULL AUTO_INCREMENT,
  `AppointmentNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LeadId` int DEFAULT NULL,
  `ContactId` int DEFAULT NULL,
  `AccountId` int DEFAULT NULL,
  `DealId` int DEFAULT NULL,
  `Title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `StartDateTime` datetime NOT NULL,
  `EndDateTime` datetime DEFAULT NULL,
  `Duration` int DEFAULT NULL,
  `Mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MeetingLink` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Agenda` text COLLATE utf8mb4_unicode_ci,
  `MeetingNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `AttendeesList` json DEFAULT NULL,
  `ReminderEnabled` tinyint(1) DEFAULT '0',
  `ReminderMinutesBefore` int DEFAULT NULL,
  `CreatedByUserId` int NOT NULL,
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `AppointmentStatusId` int DEFAULT NULL,
  `Outcome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NextFollowUpDate` datetime DEFAULT NULL,
  `FollowUpNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`AppointmentId`),
  UNIQUE KEY `UQ_appointment_appointmentnumber` (`AppointmentNumber`),
  KEY `fk_appointment_creator` (`CreatedByUserId`),
  KEY `idx_appointment_number` (`AppointmentNumber`),
  KEY `idx_appointment_date` (`StartDateTime`),
  KEY `idx_appointment_lead` (`LeadId`),
  KEY `idx_appointment_deleted` (`IsDeleted`),
  KEY `fk_appointment_status` (`AppointmentStatusId`),
  KEY `idx_appointment_contact` (`ContactId`),
  KEY `idx_appointment_account` (`AccountId`),
  KEY `idx_appointment_deal` (`DealId`),
  CONSTRAINT `fk_appointment_account` FOREIGN KEY (`AccountId`) REFERENCES `accounts` (`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_contact` FOREIGN KEY (`ContactId`) REFERENCES `contacts` (`ContactId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_creator` FOREIGN KEY (`CreatedByUserId`) REFERENCES `users` (`UserId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_deal` FOREIGN KEY (`DealId`) REFERENCES `deals` (`DealId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_lead` FOREIGN KEY (`LeadId`) REFERENCES `leads` (`LeadId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_status` FOREIGN KEY (`AppointmentStatusId`) REFERENCES `appointmentstatus` (`AppointmentStatusId`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appointmentstatus`
--

DROP TABLE IF EXISTS `appointmentstatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointmentstatus` (
  `AppointmentStatusId` int NOT NULL AUTO_INCREMENT,
  `StatusName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`AppointmentStatusId`),
  UNIQUE KEY `StatusName` (`StatusName`),
  UNIQUE KEY `UQ_appointmentstatus_statusname` (`StatusName`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auditlog`
--

DROP TABLE IF EXISTS `auditlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditlog` (
  `AuditId` bigint NOT NULL AUTO_INCREMENT,
  `TableName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RecordId` int NOT NULL,
  `Action` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `OldValues` json DEFAULT NULL,
  `NewValues` json DEFAULT NULL,
  `ChangedBy` int DEFAULT NULL,
  `ChangedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `IPAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UserAgent` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`AuditId`),
  KEY `idx_audit_table` (`TableName`),
  KEY `idx_audit_record` (`RecordId`),
  KEY `idx_audit_action` (`Action`),
  KEY `idx_audit_date` (`ChangedAt`),
  KEY `idx_audit_user` (`ChangedBy`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`ChangedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `ContactId` int NOT NULL AUTO_INCREMENT,
  `ContactNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `FirstName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LastName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Department` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AccountId` int DEFAULT NULL,
  `LeadSource` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MailingStreet` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `MailingCity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MailingState` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MailingCountry` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MailingZip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ContactId`),
  UNIQUE KEY `UQ_contacts_number` (`ContactNumber`),
  UNIQUE KEY `UQ_contacts_email` (`Email`),
  UNIQUE KEY `UQ_contacts_mobile` (`Mobile`),
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deals`
--

DROP TABLE IF EXISTS `deals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deals` (
  `DealId` int NOT NULL AUTO_INCREMENT,
  `DealNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DealName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DealStageId` int NOT NULL,
  `ClosingDate` date NOT NULL,
  `AccountId` int DEFAULT NULL,
  `ContactId` int DEFAULT NULL,
  `Amount` decimal(15,2) DEFAULT NULL,
  `Probability` int DEFAULT NULL,
  `DealType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LeadSource` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ExpectedRevenue` decimal(15,2) DEFAULT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `LostReason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
  CONSTRAINT `fk_deals_account` FOREIGN KEY (`AccountId`) REFERENCES `accounts` (`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_assigned` FOREIGN KEY (`AssignedToUserId`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_contact` FOREIGN KEY (`ContactId`) REFERENCES `contacts` (`ContactId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_created_by` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_stage` FOREIGN KEY (`DealStageId`) REFERENCES `dealstage` (`DealStageId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_deals_updated_by` FOREIGN KEY (`UpdatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `deals_chk_probability` CHECK ((`Probability` between 0 and 100))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dealstage`
--

DROP TABLE IF EXISTS `dealstage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dealstage` (
  `DealStageId` int NOT NULL AUTO_INCREMENT,
  `StageName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Probability` int DEFAULT '0',
  `DisplayOrder` int DEFAULT '0',
  `Description` text COLLATE utf8mb4_unicode_ci,
  `IsActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`DealStageId`),
  UNIQUE KEY `UQ_dealstage_name` (`StageName`),
  CONSTRAINT `dealstage_chk_probability` CHECK ((`Probability` between 0 and 100))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deliverystatus`
--

DROP TABLE IF EXISTS `deliverystatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliverystatus` (
  `DeliveryStatusId` int NOT NULL AUTO_INCREMENT,
  `StatusName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`DeliveryStatusId`),
  UNIQUE KEY `StatusName` (`StatusName`),
  UNIQUE KEY `UQ_deliverystatus_statusname` (`StatusName`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `LeadId` int NOT NULL AUTO_INCREMENT,
  `LeadNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FirstName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LastName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AlternatePhone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CompanyName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Industry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AnnualRevenue` decimal(15,2) DEFAULT NULL,
  `Rating` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Designation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Country` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'India',
  `State` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `City` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Address` text COLLATE utf8mb4_unicode_ci,
  `SourceId` int NOT NULL,
  `LeadTypeId` int NOT NULL,
  `AssignedToUserId` int DEFAULT NULL,
  `AssignedBy` int DEFAULT NULL,
  `AssignedAt` datetime DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsConverted` tinyint(1) DEFAULT '0',
  `ConvertedAt` datetime DEFAULT NULL,
  `ConvertedAccountId` int DEFAULT NULL,
  `ConvertedContactId` int DEFAULT NULL,
  `ConvertedDealId` int DEFAULT NULL,
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `LeadStatusId` int DEFAULT NULL,
  PRIMARY KEY (`LeadId`),
  UNIQUE KEY `LeadNumber` (`LeadNumber`),
  UNIQUE KEY `UQ_leads_leadnumber` (`LeadNumber`),
  UNIQUE KEY `uk_leads_email` (`Email`),
  KEY `fk_leads_assigned_by` (`AssignedBy`),
  KEY `fk_leads_created_by` (`CreatedBy`),
  KEY `idx_leads_number` (`LeadNumber`),
  KEY `idx_leads_created` (`CreatedAt`),
  KEY `idx_leads_assigned_user` (`AssignedToUserId`),
  KEY `idx_leads_source` (`SourceId`),
  KEY `idx_leads_type` (`LeadTypeId`),
  KEY `idx_leads_email` (`Email`),
  KEY `idx_leads_phone` (`Phone`),
  KEY `idx_leads_company` (`CompanyName`),
  KEY `idx_leads_deleted` (`IsDeleted`),
  KEY `idx_leads_active` (`IsActive`),
  KEY `fk_leads_status` (`LeadStatusId`),
  KEY `idx_leads_converted_account` (`ConvertedAccountId`),
  KEY `idx_leads_converted_contact` (`ConvertedContactId`),
  KEY `idx_leads_converted_deal` (`ConvertedDealId`),
  CONSTRAINT `fk_leads_assigned_by` FOREIGN KEY (`AssignedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_leads_assigned_user` FOREIGN KEY (`AssignedToUserId`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_leads_converted_account` FOREIGN KEY (`ConvertedAccountId`) REFERENCES `accounts` (`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_leads_converted_contact` FOREIGN KEY (`ConvertedContactId`) REFERENCES `contacts` (`ContactId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_leads_converted_deal` FOREIGN KEY (`ConvertedDealId`) REFERENCES `deals` (`DealId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_leads_created_by` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_leads_source` FOREIGN KEY (`SourceId`) REFERENCES `leadsource` (`SourceId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_leads_status` FOREIGN KEY (`LeadStatusId`) REFERENCES `leadstatus` (`LeadStatusId`),
  CONSTRAINT `fk_leads_type` FOREIGN KEY (`LeadTypeId`) REFERENCES `leadtype` (`LeadTypeId`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leadsource`
--

DROP TABLE IF EXISTS `leadsource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leadsource` (
  `SourceId` int NOT NULL AUTO_INCREMENT,
  `SourceName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `SourceType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`SourceId`),
  UNIQUE KEY `SourceName` (`SourceName`),
  UNIQUE KEY `UQ_leadsource_sourcename` (`SourceName`),
  KEY `idx_source_active` (`IsActive`),
  KEY `idx_source_deleted` (`IsDeleted`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leadstatus`
--

DROP TABLE IF EXISTS `leadstatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leadstatus` (
  `LeadStatusId` int NOT NULL AUTO_INCREMENT,
  `StatusName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`LeadStatusId`),
  UNIQUE KEY `StatusName` (`StatusName`),
  UNIQUE KEY `UQ_leadstatus_statusname` (`StatusName`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leadtype`
--

DROP TABLE IF EXISTS `leadtype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leadtype` (
  `LeadTypeId` int NOT NULL AUTO_INCREMENT,
  `TypeName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `Priority` int DEFAULT '0',
  `IsActive` tinyint(1) DEFAULT '1',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`LeadTypeId`),
  UNIQUE KEY `TypeName` (`TypeName`),
  UNIQUE KEY `UQ_leadtype_typename` (`TypeName`),
  KEY `idx_leadtype_active` (`IsActive`),
  KEY `idx_leadtype_priority` (`Priority`),
  KEY `idx_leadtype_deleted` (`IsDeleted`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lostorder`
--

DROP TABLE IF EXISTS `lostorder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lostorder` (
  `LostOrderId` int NOT NULL AUTO_INCREMENT,
  `ProposalId` int NOT NULL,
  `Reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DetailedFeedback` text COLLATE utf8mb4_unicode_ci,
  `CompetitorWon` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LostDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`LostOrderId`),
  UNIQUE KEY `ProposalId` (`ProposalId`),
  UNIQUE KEY `UQ_lostorder_proposal` (`ProposalId`),
  KEY `idx_lostorder_date` (`LostDate`),
  KEY `idx_lostorder_reason` (`Reason`),
  KEY `idx_lostorder_deleted` (`IsDeleted`),
  CONSTRAINT `fk_lostorder_proposal` FOREIGN KEY (`ProposalId`) REFERENCES `proposal` (`ProposalId`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paymentstatus`
--

DROP TABLE IF EXISTS `paymentstatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paymentstatus` (
  `PaymentStatusId` int NOT NULL AUTO_INCREMENT,
  `StatusName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`PaymentStatusId`),
  UNIQUE KEY `StatusName` (`StatusName`),
  UNIQUE KEY `UQ_paymentstatus_statusname` (`StatusName`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proposal`
--

DROP TABLE IF EXISTS `proposal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposal` (
  `ProposalId` int NOT NULL AUTO_INCREMENT,
  `ProposalNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DealId` int NOT NULL,
  `ProposalTitle` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ProposalAmount` decimal(15,2) NOT NULL,
  `Currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `ProposalDocumentPath` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `VersionNo` int DEFAULT '1',
  `ParentProposalId` int DEFAULT NULL,
  `ValidityDate` date DEFAULT NULL,
  `PaymentTerms` text COLLATE utf8mb4_unicode_ci,
  `DeliveryTerms` text COLLATE utf8mb4_unicode_ci,
  `SubmittedAt` datetime DEFAULT NULL,
  `ApprovedByUserId` int DEFAULT NULL,
  `ApprovedAt` datetime DEFAULT NULL,
  `RejectedAt` datetime DEFAULT NULL,
  `RejectionReason` text COLLATE utf8mb4_unicode_ci,
  `DecisionDate` datetime DEFAULT NULL,
  `InternalNotes` text COLLATE utf8mb4_unicode_ci,
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CreatedBy` int DEFAULT NULL,
  `ProposalStatusId` int DEFAULT NULL,
  `ContentHash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ProposalId`),
  UNIQUE KEY `ProposalNumber` (`ProposalNumber`),
  UNIQUE KEY `UQ_proposal_proposalnumber` (`ProposalNumber`),
  UNIQUE KEY `uq_deal_content` (`DealId`,`ContentHash`),
  UNIQUE KEY `uq_deal_version` (`DealId`,`VersionNo`),
  KEY `fk_proposal_approvedby` (`ApprovedByUserId`),
  KEY `fk_proposal_created_by` (`CreatedBy`),
  KEY `idx_proposal_number` (`ProposalNumber`),
  KEY `idx_proposal_parent` (`ParentProposalId`),
  KEY `idx_proposal_submitted` (`SubmittedAt`),
  KEY `idx_proposal_deleted` (`IsDeleted`),
  KEY `fk_proposal_status` (`ProposalStatusId`),
  KEY `idx_proposal_deal` (`DealId`),
  KEY `idx_proposal_deal_version` (`DealId`,`VersionNo` DESC),
  CONSTRAINT `fk_proposal_approvedby` FOREIGN KEY (`ApprovedByUserId`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_proposal_created_by` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_proposal_deal` FOREIGN KEY (`DealId`) REFERENCES `deals` (`DealId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_proposal_parent` FOREIGN KEY (`ParentProposalId`) REFERENCES `proposal` (`ProposalId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_proposal_status` FOREIGN KEY (`ProposalStatusId`) REFERENCES `proposalstatus` (`ProposalStatusId`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proposalappointment`
--

DROP TABLE IF EXISTS `proposalappointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposalappointment` (
  `ProposalAppointmentId` int NOT NULL AUTO_INCREMENT,
  `ProposalId` int NOT NULL,
  `AppointmentId` int NOT NULL,
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ProposalAppointmentId`),
  UNIQUE KEY `uk_proposal_appointment` (`ProposalId`,`AppointmentId`),
  UNIQUE KEY `UQ_proposalappointment` (`ProposalId`,`AppointmentId`),
  KEY `idx_pa_proposal` (`ProposalId`),
  KEY `idx_pa_appointment` (`AppointmentId`),
  KEY `idx_pa_deleted` (`IsDeleted`),
  CONSTRAINT `fk_pa_appointment` FOREIGN KEY (`AppointmentId`) REFERENCES `appointment` (`AppointmentId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pa_proposal` FOREIGN KEY (`ProposalId`) REFERENCES `proposal` (`ProposalId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proposalstatus`
--

DROP TABLE IF EXISTS `proposalstatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposalstatus` (
  `ProposalStatusId` int NOT NULL AUTO_INCREMENT,
  `StatusName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ProposalStatusId`),
  UNIQUE KEY `StatusName` (`StatusName`),
  UNIQUE KEY `UQ_proposalstatus_statusname` (`StatusName`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salesorder`
--

DROP TABLE IF EXISTS `salesorder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salesorder` (
  `SalesOrderId` int NOT NULL AUTO_INCREMENT,
  `ProposalId` int NOT NULL,
  `OrderNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `OrderDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `OrderValue` decimal(15,2) NOT NULL,
  `Currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `ExpectedDeliveryDate` date DEFAULT NULL,
  `ActualDeliveryDate` date DEFAULT NULL,
  `PONumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PODocument` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `InvoiceGenerated` tinyint(1) DEFAULT '0',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `PaymentStatusId` int DEFAULT NULL,
  `DeliveryStatusId` int DEFAULT NULL,
  PRIMARY KEY (`SalesOrderId`),
  UNIQUE KEY `ProposalId` (`ProposalId`),
  UNIQUE KEY `OrderNumber` (`OrderNumber`),
  UNIQUE KEY `UQ_salesorder_ordernumber` (`OrderNumber`),
  KEY `idx_salesorder_number` (`OrderNumber`),
  KEY `idx_salesorder_date` (`OrderDate`),
  KEY `idx_salesorder_deleted` (`IsDeleted`),
  KEY `fk_salesorder_payment` (`PaymentStatusId`),
  KEY `fk_salesorder_delivery` (`DeliveryStatusId`),
  CONSTRAINT `fk_salesorder_delivery` FOREIGN KEY (`DeliveryStatusId`) REFERENCES `deliverystatus` (`DeliveryStatusId`),
  CONSTRAINT `fk_salesorder_payment` FOREIGN KEY (`PaymentStatusId`) REFERENCES `paymentstatus` (`PaymentStatusId`),
  CONSTRAINT `fk_salesorder_proposal` FOREIGN KEY (`ProposalId`) REFERENCES `proposal` (`ProposalId`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userrole`
--

DROP TABLE IF EXISTS `userrole`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userrole` (
  `RoleId` int NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `IsActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`RoleId`),
  UNIQUE KEY `RoleName` (`RoleName`),
  UNIQUE KEY `UQ_userrole_rolename` (`RoleName`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsDeleted` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `RoleId` int DEFAULT NULL,
  PRIMARY KEY (`UserId`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `UQ_users_email` (`Email`),
  KEY `idx_users_active` (`IsActive`),
  KEY `idx_users_email` (`Email`),
  KEY `idx_users_deleted` (`IsDeleted`),
  KEY `fk_users_role` (`RoleId`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`RoleId`) REFERENCES `userrole` (`RoleId`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'salescrmv1'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-18 17:20:56
