-- MySQL dump 10.13  Distrib 9.5.0, for Win64 (x86_64)
--
-- Host: localhost    Database: healthtrack
-- ------------------------------------------------------
-- Server version	9.5.0

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '62a73c68-d13a-11f0-8906-8084890022d2:1-130';

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `appointment_uid` varchar(50) NOT NULL,
  `user_id` int NOT NULL,
  `provider_id` int NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `consultation_type` enum('In-Person','Virtual') NOT NULL,
  `memo` text,
  `status` enum('scheduled','cancelled','completed') DEFAULT 'scheduled',
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointment_id`),
  UNIQUE KEY `appointment_uid` (`appointment_uid`),
  KEY `user_id` (`user_id`),
  KEY `provider_id` (`provider_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`provider_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,'APT001',1,1,'2024-12-15','10:00:00','In-Person','Annual checkup','scheduled',NULL,NULL,'2025-12-04 18:18:46'),(2,'APT002',2,1,'2024-12-16','14:30:00','Virtual','Follow-up consultation','scheduled',NULL,NULL,'2025-12-04 18:18:46'),(3,'APT66124036',4,1,'2025-12-10','14:30:00','In-Person','Future appointment','scheduled',NULL,NULL,'2025-12-04 18:37:32'),(4,'APT75F61BA0',1,1,'2025-12-10','14:30:00','In-Person','Test appointment','scheduled',NULL,NULL,'2025-12-06 14:18:48'),(5,'APTB822FA55',1,1,'2025-12-10','14:30:00','In-Person','Test appointment','scheduled',NULL,NULL,'2025-12-06 14:19:45'),(6,'APT0BBEF4CA',6,4,'2025-12-06','22:25:00','In-Person',NULL,'scheduled',NULL,NULL,'2025-12-06 14:20:28'),(7,'APT036A75A5',8,1,'2025-12-20','22:27:00','In-Person','1','scheduled',NULL,NULL,'2025-12-07 14:28:09'),(8,'APT724AF88A',1,4,'2025-12-20','23:45:00','In-Person',NULL,'scheduled',NULL,NULL,'2025-12-07 14:46:02');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_participants`
--

DROP TABLE IF EXISTS `challenge_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_participants` (
  `participant_id` int NOT NULL AUTO_INCREMENT,
  `challenge_id` int NOT NULL,
  `user_id` int NOT NULL,
  `progress` int DEFAULT '0',
  `progress_notes` text,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`participant_id`),
  UNIQUE KEY `unique_challenge_participant` (`challenge_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `challenge_participants_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `wellness_challenges` (`challenge_id`) ON DELETE CASCADE,
  CONSTRAINT `challenge_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_participants`
--

LOCK TABLES `challenge_participants` WRITE;
/*!40000 ALTER TABLE `challenge_participants` DISABLE KEYS */;
INSERT INTO `challenge_participants` VALUES (4,2,2,28,NULL,'2025-12-04 18:18:46'),(5,3,4,0,NULL,'2025-12-04 18:37:32'),(6,4,6,0,NULL,'2025-12-06 14:22:43'),(14,4,1,0,NULL,'2025-12-06 14:54:34'),(16,4,8,100,NULL,'2025-12-07 14:24:37'),(17,5,8,0,NULL,'2025-12-07 14:42:17');
/*!40000 ALTER TABLE `challenge_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family_groups`
--

DROP TABLE IF EXISTS `family_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family_groups` (
  `family_id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`family_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `family_groups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family_groups`
--

LOCK TABLES `family_groups` WRITE;
/*!40000 ALTER TABLE `family_groups` DISABLE KEYS */;
INSERT INTO `family_groups` VALUES (1,'Doe Family',1,'2025-12-04 18:18:46'),(2,'Test Family',4,'2025-12-04 18:37:32'),(3,'你好',6,'2025-12-06 14:21:22'),(6,'12345',1,'2025-12-06 15:13:57'),(7,'10086',8,'2025-12-07 14:25:25');
/*!40000 ALTER TABLE `family_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family_members`
--

DROP TABLE IF EXISTS `family_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family_members` (
  `family_member_id` int NOT NULL AUTO_INCREMENT,
  `family_id` int NOT NULL,
  `user_id` int NOT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  `can_manage` tinyint(1) DEFAULT '0',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`family_member_id`),
  UNIQUE KEY `unique_family_member` (`family_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `family_members_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `family_groups` (`family_id`) ON DELETE CASCADE,
  CONSTRAINT `family_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family_members`
--

LOCK TABLES `family_members` WRITE;
/*!40000 ALTER TABLE `family_members` DISABLE KEYS */;
INSERT INTO `family_members` VALUES (2,1,2,'Spouse',1,'2025-12-04 18:18:46'),(3,1,3,'Child',0,'2025-12-04 18:18:46'),(4,2,4,NULL,1,'2025-12-04 18:37:32'),(5,3,6,NULL,1,'2025-12-06 14:21:22'),(9,6,1,NULL,1,'2025-12-06 15:13:57'),(10,7,8,NULL,1,'2025-12-07 14:25:25'),(11,7,1,'孩子',0,'2025-12-07 14:26:05');
/*!40000 ALTER TABLE `family_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health_metrics`
--

DROP TABLE IF EXISTS `health_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_metrics` (
  `metric_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `metric_date` date NOT NULL,
  `metric_type` varchar(50) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `notes` text,
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`metric_id`),
  KEY `idx_user_date` (`user_id`,`metric_date`),
  CONSTRAINT `health_metrics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health_metrics`
--

LOCK TABLES `health_metrics` WRITE;
/*!40000 ALTER TABLE `health_metrics` DISABLE KEYS */;
INSERT INTO `health_metrics` VALUES (1,1,'2024-12-01','steps',8500.00,'steps',NULL,'2025-12-04 18:18:46'),(2,1,'2024-12-01','weight',75.50,'kg',NULL,'2025-12-04 18:18:46'),(4,2,'2024-12-01','steps',10500.00,'steps',NULL,'2025-12-04 18:18:46'),(5,2,'2024-12-01','weight',62.30,'kg',NULL,'2025-12-04 18:18:46'),(6,4,'2024-12-04','steps',8500.00,'steps','Daily steps','2025-12-04 18:37:05'),(7,6,'2025-12-06','weight',35.00,'kg',NULL,'2025-12-06 13:24:19'),(8,6,'2025-12-06','blood_pressure',70.00,'bpm',NULL,'2025-12-06 13:27:27'),(10,7,'2024-12-01','weight',70.50,'kg',NULL,'2025-12-06 16:01:34'),(11,7,'2024-12-15','weight',71.20,'kg',NULL,'2025-12-06 16:01:45'),(12,7,'2024-12-10','blood_pressure',120.00,'mmHg',NULL,'2025-12-06 16:01:56'),(13,1,'2025-12-07','weight',64.00,'kg',NULL,'2025-12-06 16:04:29'),(14,8,'2025-12-07','blood_pressure',10086.00,NULL,NULL,'2025-12-07 14:22:49');
/*!40000 ALTER TABLE `health_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitations`
--

DROP TABLE IF EXISTS `invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitations` (
  `invitation_id` int NOT NULL AUTO_INCREMENT,
  `invitation_uid` varchar(50) NOT NULL,
  `sent_by` int NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `invitation_type` enum('challenge','family','data_share') NOT NULL,
  `related_id` int DEFAULT NULL,
  `status` enum('pending','accepted','expired','cancelled') DEFAULT 'pending',
  `initiated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT ((now() + interval 15 day)),
  PRIMARY KEY (`invitation_id`),
  UNIQUE KEY `invitation_uid` (`invitation_uid`),
  KEY `sent_by` (`sent_by`),
  CONSTRAINT `invitations_ibfk_1` FOREIGN KEY (`sent_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitations`
--

LOCK TABLES `invitations` WRITE;
/*!40000 ALTER TABLE `invitations` DISABLE KEYS */;
INSERT INTO `invitations` VALUES (1,'INV21308829',1,'jane.smith@example.com',NULL,'family',6,'pending','2025-12-06 15:14:08',NULL,'2025-12-21 15:14:08'),(2,'INV15E394CE',1,'jane.smith@example.com',NULL,'challenge',4,'pending','2025-12-06 15:19:13',NULL,'2025-12-21 15:19:13'),(3,'INV3F065292',8,'john.doe@example.com',NULL,'challenge',5,'pending','2025-12-07 14:43:01',NULL,'2025-12-22 14:43:01');
/*!40000 ALTER TABLE `invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `providers`
--

DROP TABLE IF EXISTS `providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `providers` (
  `provider_id` int NOT NULL AUTO_INCREMENT,
  `license_number` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`provider_id`),
  UNIQUE KEY `license_number` (`license_number`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `providers`
--

LOCK TABLES `providers` WRITE;
/*!40000 ALTER TABLE `providers` DISABLE KEYS */;
INSERT INTO `providers` VALUES (1,'MD123456','Dr. Sarah Wilson','sarah.wilson@hospital.com','+15551234567','General Practitioner',1,'2025-12-04 18:18:46'),(2,'MD789012','Dr. Michael Chen','michael.chen@clinic.com','+15559876543','Cardiologist',1,'2025-12-04 18:18:46'),(3,'MD345678','Dr. Emily Brown','emily.brown@wellness.com','+15551122334','Nutritionist',0,'2025-12-04 18:18:46'),(4,'qn88md9066','Dr. Sima Luther','','','Database Management',0,'2025-12-06 13:49:36'),(5,'whu1893','Gourse Fever','','','Data Science',0,'2025-12-06 16:22:18'),(6,'a1222','qunimade','','','2',0,'2025-12-07 14:57:03');
/*!40000 ALTER TABLE `providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_emails`
--

DROP TABLE IF EXISTS `user_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_emails` (
  `email_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email` varchar(100) NOT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email_id`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_emails_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_emails`
--

LOCK TABLES `user_emails` WRITE;
/*!40000 ALTER TABLE `user_emails` DISABLE KEYS */;
INSERT INTO `user_emails` VALUES (1,1,'john.doe@example.com',1,1,'2025-12-04 18:18:46'),(2,1,'john.doe.work@example.com',1,0,'2025-12-04 18:18:46'),(3,2,'jane.smith@example.com',1,1,'2025-12-04 18:18:46'),(4,3,'bob.johnson@example.com',0,1,'2025-12-04 18:18:46'),(5,4,'test@example.com',0,1,'2025-12-04 18:36:21'),(6,5,'windows@example.com',0,1,'2025-12-04 18:43:32'),(7,6,'gutian2002@gmail.com',1,1,'2025-12-06 13:14:42'),(8,6,'123@qq.com',1,0,'2025-12-06 13:39:42'),(9,7,'test2@example.com',0,1,'2025-12-06 16:00:37'),(10,8,'10086@1.com',1,1,'2025-12-07 14:21:58'),(11,8,'10086@11.com',0,0,'2025-12-07 14:40:28');
/*!40000 ALTER TABLE `user_emails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_providers`
--

DROP TABLE IF EXISTS `user_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_providers` (
  `user_provider_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `provider_id` int NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `verified` tinyint(1) DEFAULT '0',
  `linked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unlinked_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_provider_id`),
  UNIQUE KEY `unique_user_provider` (`user_id`,`provider_id`),
  KEY `provider_id` (`provider_id`),
  CONSTRAINT `user_providers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_providers_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`provider_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_providers`
--

LOCK TABLES `user_providers` WRITE;
/*!40000 ALTER TABLE `user_providers` DISABLE KEYS */;
INSERT INTO `user_providers` VALUES (1,1,1,1,1,'2025-12-04 18:18:46',NULL),(2,1,2,0,1,'2025-12-04 18:18:46','2025-12-07 14:46:57'),(3,2,1,1,1,'2025-12-04 18:18:46',NULL),(4,3,3,1,0,'2025-12-04 18:18:46',NULL),(5,4,1,1,0,'2025-12-04 18:37:04',NULL),(6,6,1,0,0,'2025-12-06 14:13:51',NULL),(7,6,4,0,0,'2025-12-06 14:13:57',NULL),(8,1,5,0,0,'2025-12-06 16:22:23','2025-12-07 14:46:56'),(9,8,2,0,0,'2025-12-07 14:26:38','2025-12-07 14:26:44'),(10,8,1,0,0,'2025-12-07 14:26:41','2025-12-07 14:30:13'),(59,8,3,0,0,'2025-12-07 14:30:01','2025-12-07 14:30:25'),(61,8,5,0,0,'2025-12-07 14:30:16','2025-12-07 14:30:24'),(70,8,4,0,0,'2025-12-07 14:39:18','2025-12-07 14:39:20'),(77,1,4,0,0,'2025-12-07 14:45:20','2025-12-07 14:46:37'),(78,1,3,0,0,'2025-12-07 14:45:22','2025-12-07 14:54:13'),(86,1,6,0,0,'2025-12-07 14:57:06',NULL);
/*!40000 ALTER TABLE `user_providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `health_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `phone_verified` tinyint(1) DEFAULT '0',
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `health_id` (`health_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'HT001','John Doe','+1234567890',1,'$2b$10$RUL4pEjj1.ATnig6KMqbkuXz8RPzvqGupaAgEPHT5AAgOL/AqSTGa','2025-12-04 18:18:46','2025-12-06 14:06:33'),(2,'HT002','Jane Smith','+0987654321',1,'$2a$10$YourHashedPasswordHere','2025-12-04 18:18:46','2025-12-04 18:18:46'),(3,'HT003','Bob Johnson','+1122334455',0,'$2a$10$YourHashedPasswordHere','2025-12-04 18:18:46','2025-12-04 18:18:46'),(4,'HT004','Test User','+15551234567',0,'$2b$10$LCbPUX6bvmNMdj/VtMQrYuOs9Gxpcb6dbfH4ZRErK/TwLal1PrlFy','2025-12-04 18:36:21','2025-12-04 18:36:21'),(5,'HT005','Windows User','+15559876543',0,'$2b$10$9qEOky2fvi9iDQ1ZVwKVxuXAA.tnfgCOHiY7bQBjgELx4pvNZWGhG','2025-12-04 18:43:32','2025-12-04 18:43:32'),(6,'GT124','Gutian','120999982',1,'$2b$10$2V/vomUDFkCdf1uKPjyjPeym5mQzpzz.jb.qSxDZaaoGN0qoyqOTK','2025-12-06 13:14:42','2025-12-06 16:27:29'),(7,'TEST002','Test User 2','+12345678902',0,'$2b$10$m.Vgoe/mJaK3wkG/lthiMuDuq2BwkqweoavXiYwp/uKOYJPnyx6ba','2025-12-06 16:00:37','2025-12-06 16:00:37'),(8,'gugugugu10086','gugugugu','10086',1,'$2b$10$B98Bn/YgQoAViJSF7kpDcur8nC77knxHZPzitXX/9ce/1TmZVczRS','2025-12-07 14:21:58','2025-12-07 14:23:06');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wellness_challenges`
--

DROP TABLE IF EXISTS `wellness_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wellness_challenges` (
  `challenge_id` int NOT NULL AUTO_INCREMENT,
  `challenge_uid` varchar(50) NOT NULL,
  `created_by` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `goal` varchar(500) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','completed','cancelled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`challenge_id`),
  UNIQUE KEY `challenge_uid` (`challenge_uid`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `wellness_challenges_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wellness_challenges`
--

LOCK TABLES `wellness_challenges` WRITE;
/*!40000 ALTER TABLE `wellness_challenges` DISABLE KEYS */;
INSERT INTO `wellness_challenges` VALUES (2,'CHL002',2,'Hydration Goal','Stay hydrated daily','Drink 2 liters of water daily for 30 days','2024-12-01','2024-12-30','active','2025-12-04 18:18:46'),(3,'CHL976A1D4C',4,'Future Challenge','A future wellness challenge','Exercise 30 minutes daily for 2 weeks','2025-12-10','2025-12-24','active','2025-12-04 18:37:32'),(4,'CHL436A7C87',6,'123456',NULL,'123456','2025-12-07','2025-12-26','active','2025-12-06 14:22:43'),(5,'CHL8704B5EA',8,'111','11111','111111','2025-12-18','2025-12-25','active','2025-12-07 14:42:17');
/*!40000 ALTER TABLE `wellness_challenges` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-07 23:17:28
