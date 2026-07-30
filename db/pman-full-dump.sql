-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: pman
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Current Database: `pman`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `pman` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `pman`;

--
-- Table structure for table `archives`
--

DROP TABLE IF EXISTS `archives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archives` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `project_json` json NOT NULL,
  `items_json` json NOT NULL,
  `summary_json` json NOT NULL,
  `archived_at` datetime NOT NULL,
  `archived_note` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archives`
--

LOCK TABLES `archives` WRITE;
/*!40000 ALTER TABLE `archives` DISABLE KEYS */;
/*!40000 ALTER TABLE `archives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Hß╗ç thß╗æng',
  `action` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int DEFAULT NULL,
  `entity_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `detail` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,1,'admin','Quản trị viên','login','user',1,'Quản trị viên','','2026-07-08 14:25:55'),(2,1,'admin','Quản trị viên','create','item',52,'Test MySQL item','','2026-07-08 14:25:55'),(3,1,'admin','Quản trị viên','delete','item',52,'Test MySQL item','','2026-07-08 14:26:05'),(4,1,'admin','Quản trị viên','login','user',1,'Quản trị viên','','2026-07-08 14:42:02');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `contractor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `assignee` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `progress` int NOT NULL DEFAULT '0',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chua_bat_dau',
  `priority` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'binh_thuong',
  `actual_vol` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `disbursed` decimal(18,2) NOT NULL DEFAULT '0.00',
  `note` text COLLATE utf8mb4_unicode_ci,
  `done_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_items_project` (`project_id`),
  KEY `idx_items_status` (`status`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,2,'Lập đề cương nhiệm vụ, điều khoản tham chiếu và dự toán','Giai đoạn chuẩn bị đầu tư','PMB','','2026-03-24','2026-04-11',0,'hoan_thanh','binh_thuong','',0.00,'','2026-04-11','2026-06-26 02:55:24','2026-06-30 02:44:57'),(2,2,'Lấy ý kiến các Ban - Trình Ban TGĐ thông qua giao PMB phê duyệt','Giai đoạn chuẩn bị đầu tư','Ban KHCN&CĐS và các Ban','…','2026-04-06','2026-05-03',0,'hoan_thanh','binh_thuong','',0.00,'','2026-05-03','2026-06-26 02:55:24','2026-06-30 02:51:44'),(3,2,'Văn bản gửi PMB triển khai các bước tiếp theo','Giai đoạn chuẩn bị đầu tư','Ban KHCN&CĐS','','2026-05-04','2026-05-04',0,'hoan_thanh','binh_thuong','',0.00,'','2026-05-04','2026-06-26 02:55:24','2026-06-30 02:54:10'),(4,2,'Phê duyệt đề cương nhiệm vụ, điều khoản tham chiếu và Dự toán','Giai đoạn chuẩn bị đầu tư','PMB','','2026-05-04','2026-05-12',0,'hoan_thanh','binh_thuong','',0.00,'','2026-05-12','2026-06-26 02:55:24','2026-06-30 02:55:19'),(5,2,'Các bước thực hiện LCNT và ký hợp đồng','Giai đoạn chuẩn bị đầu tư','PMB','','2026-05-13','2026-06-01',0,'hoan_thanh','binh_thuong','',0.00,'','2026-06-01','2026-06-26 02:55:24','2026-06-30 03:01:16'),(6,2,'Nhà thầu TV01: thực hiện hợp đồng thực hiện xây dựng báo cáo chủ trương đầu tư','Gói tư vấn 01','TV01','','2026-06-02','2026-06-08',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-07-07 03:14:37'),(7,2,'Nhà thầu TV01: Nộp sản phẩm báo cáo chủ trương đầu tư','Gói tư vấn 01','TV01','','2026-06-09','2026-06-09',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 06:46:42'),(8,2,'PMB phát hành văn bản gửi TV02 đề nghị thẩm tra sản phẩm của TV01','Giai đoạn chuẩn bị đầu tư','PMB','','2026-06-10','2026-06-10',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 06:46:52'),(9,2,'Nhà thầu TV02: Thẩm tra sản phẩm báo cáo chủ trương đầu tư của TV01','Gói tư vấn 02','TV02','','2026-06-10','2026-06-12',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 06:46:14'),(10,2,'Báo cáo Tổng công ty phê duyệt Chủ trương đầu tư','Giai đoạn chuẩn bị đầu tư','PMB','','2026-06-13','2026-06-13',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 06:47:13'),(11,2,'Xem xét phê duyệt chủ trương đầu tư','Giai đoạn chuẩn bị đầu tư','Ban KHCN&CĐS và các Ban','','2026-06-14','2026-06-20',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 06:47:23'),(12,2,'Phê duyệt chủ trương đầu tư','Giai đoạn chuẩn bị đầu tư','Ban KHCN&CĐS và các Ban','','2026-06-21','2026-06-21',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 06:47:33'),(13,2,'Nhà thầu TV01: thực hiện hợp đồng xây dựng FS','Gói tư vấn 01','TV01','','2026-06-22','2026-06-28',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(14,2,'Nhà thầu TV01: Nộp sản phẩm FS','Gói tư vấn 01','TV01','','2026-06-29','2026-06-29',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(15,2,'PMB phát hành văn bản gửi TV02 đề nghị thẩm tra sản phẩm của TV01','Giai đoạn chuẩn bị đầu tư','PMB','','2026-06-30','2026-06-30',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(16,2,'Nhà thầu TV02: Thẩm tra sản phẩm FS của TV01','Gói tư vấn 02','TV02','','2026-06-30','2026-07-02',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(17,2,'Báo cáo Tổng công ty phê duyệt FS','Giai đoạn chuẩn bị đầu tư','PMB','','2026-07-03','2026-07-03',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(18,2,'Xem xét phê duyệt FS','Giai đoạn chuẩn bị đầu tư','Ban KHCN&CĐS và các Ban','','2026-07-04','2026-07-06',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(19,2,'Phê duyệt FS','Giai đoạn chuẩn bị đầu tư','Ban KHCN&CĐS và các Ban','','2026-07-07','2026-07-07',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(20,2,'Trình KHLCNT','Giai đoạn thực hiện dự án','Nhà thầu và PMB','','2026-07-07','2026-07-07',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(21,2,'Thẩm tra KHLCNT','Giai đoạn thực hiện dự án','PMB, các ban chức năng và các Đơn vị liên quan','','2026-07-08','2026-07-09',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(22,2,'Phê duyệt KHLCNT phạm vi Cơ quan TCT','Giai đoạn thực hiện dự án','PMB','','2026-07-10','2026-07-10',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(23,2,'Phê duyệt KHLCNT tập trung (Bao gồm TMP và HND)','Giai đoạn thực hiện dự án','PMB,HND, TMP','','2026-07-10','2026-07-12',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(24,2,'Lập và trình E-HSMT','Giai đoạn thực hiện dự án','PMB','','2026-07-12','2026-07-14',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(25,2,'Thẩm tra E-HSMT','Giai đoạn thực hiện dự án','PMB','','2026-07-14','2026-07-16',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(26,2,'Phê duyệt E-HSMT','Giai đoạn thực hiện dự án','PMB','','2026-07-16','2026-07-16',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(27,2,'Thông báo mời thầu','Giai đoạn thực hiện dự án','PMB','','2026-07-17','2026-07-17',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(28,2,'Nhà thầu chuẩn bị HSDT','Giai đoạn thực hiện dự án','PMB','','2026-07-18','2026-08-04',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(29,2,'Mở thầu đánh giá HSDT','Giai đoạn thực hiện dự án','PMB','','2026-08-05','2026-08-14',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(30,2,'Trình KQLCNT','Giai đoạn thực hiện dự án','PMB','','2026-08-15','2026-08-15',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(31,2,'Thẩm định KQLCNT','Giai đoạn thực hiện dự án','Tổng công ty','','2026-08-16','2026-08-22',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(32,2,'Báo cáo HĐQT thông qua','Giai đoạn thực hiện dự án','Tổng công ty','','2026-08-22','2026-08-28',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(33,2,'Phê duyệt KQLCNT','Giai đoạn thực hiện dự án','PMB','','2026-08-28','2026-08-28',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(34,2,'Thông báo kết quả lựa chọn nhà thầu và ký kết hợp đồng','Giai đoạn thực hiện dự án','PMB','','2026-08-29','2026-08-29',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(35,2,'Nhà thầu thực hiện hợp đồng','Giai đoạn thực hiện dự án','Nhà thầu và PMB','','2026-08-30','2026-11-27',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(36,2,'Nghiệm thu hoàn thành đưa vào sử dụng','Giai đoạn kết thúc dự án','PMB, các ban chức năng và các Đơn vị liên quan','','2026-11-28','2026-12-27',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 02:55:24','2026-06-26 02:55:24'),(37,3,'Lựa chọn tư vấn lập báo cáo chủ trương đầu tư','','','','2026-01-01','2026-03-01',0,'hoan_thanh','binh_thuong','',0.00,'Hoàn thành trễ 121 ngày (kế hoạch: 1/3/2026, thực tế: 30/6/2026)','2026-06-30','2026-06-26 03:03:51','2026-06-30 03:24:42'),(38,3,'Phê duyệt chủ trương đầu tư dự án','','','','2026-03-01','2026-04-30',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 03:04:32','2026-06-26 03:04:32'),(39,3,'Phê duyệt dự án đầu tư','','','','2026-04-01','2026-10-31',0,'dang_thuc_hien','binh_thuong','',0.00,'',NULL,'2026-06-26 03:04:58','2026-06-26 03:04:58'),(40,3,'Tổ chức LCNT và ký kết hợp đồng gói thầu chính','','','','2026-10-01','2026-12-31',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 03:05:33','2026-06-26 03:05:33'),(41,3,'Tổ chức thi công và nghiệm thu','','','','2026-12-01','2027-12-31',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 03:05:55','2026-06-26 03:05:55'),(42,3,'Phê duyệt quyết toán tự án','','','','2027-12-01','2027-12-31',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 03:06:19','2026-06-26 03:06:19'),(43,1,'Lập và phê duyệt chủ trương đầu tư','','','','2024-08-01','2024-08-10',0,'hoan_thanh','binh_thuong','',0.00,'Hoàn thành trễ 16 ngày (kế hoạch: 10/8/2024, thực tế: 26/8/2024)','2024-08-26','2026-06-26 03:13:17','2026-06-30 02:51:07'),(44,1,'Lập và phê duyệt KHLCNT, đề cương, điều khoản tham chiếu. Tư vấn Thẩm tra FS và tổ chức LCNT gói thầu Tư vấn Thẩm tra FS','','','','2024-11-01','2024-12-01',0,'hoan_thanh','binh_thuong','',0.00,'Hoàn thành trước hạn 62 ngày (kế hoạch: 1/12/2024, thực tế: 30/9/2024)\nHoàn thành trước hạn 76 ngày (kế hoạch: 1/12/2024, thực tế: 16/9/2024)','2024-09-16','2026-06-26 03:14:42','2026-06-30 02:50:46'),(45,1,'Lập và phê duyệt dự án đầu tư','','','','2024-12-01','2025-05-01',0,'hoan_thanh','binh_thuong','',0.00,'Hoàn thành trước hạn 227 ngày (kế hoạch: 1/5/2025, thực tế: 16/9/2024)\nHoàn thành trước hạn 105 ngày (kế hoạch: 1/5/2025, thực tế: 16/1/2025)','2025-01-16','2026-06-26 03:15:18','2026-06-30 02:50:22'),(46,1,'Lập và phê duyệt KHLCNT, đề cương, điều khoản tham chiếu và các gói thầu Tư vấn và Tổ chức LCNT các gói thầu Tư vấn','','','','2025-05-01','2025-08-01',0,'hoan_thanh','binh_thuong','',0.00,'Hoàn thành trễ 21 ngày (kế hoạch: 1/8/2025, thực tế: 22/8/2025)','2025-08-22','2026-06-26 03:16:28','2026-06-30 02:49:55'),(47,1,'Tổ chức lựa chọn Nhà thầu gói thầu chính','','','','2025-10-01','2026-02-01',0,'hoan_thanh','binh_thuong','',0.00,'Hoàn thành trễ 95 ngày (kế hoạch: 1/2/2026, thực tế: 7/5/2026)','2026-05-07','2026-06-26 03:17:01','2026-06-30 02:47:09'),(48,1,'Triển khai khảo sát, thiết kế và thi công','','','','2026-02-01','2026-02-28',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 03:17:32','2026-06-30 02:46:16'),(49,1,'Nghiệm thu hoàn thành','','','','2026-02-22','2026-02-28',0,'qua_han','binh_thuong','',0.00,'',NULL,'2026-06-26 03:18:07','2026-06-26 03:18:07'),(50,1,'Hoàn thành phê duyệt quyết toán dự án','','','','2026-08-01','2026-08-31',0,'chua_bat_dau','binh_thuong','',0.00,'',NULL,'2026-06-26 03:18:35','2026-06-26 03:18:35'),(51,2,'Khảo sát, tham quan, hội thảo, tổng hợp và lựa chọn mô hình triển khai','','','','2025-08-04','2025-12-31',0,'hoan_thanh','binh_thuong','',0.00,'Hoàn thành trễ 181 ngày (kế hoạch: 31/12/2025, thực tế: 30/6/2026)','2026-06-30','2026-06-30 03:08:35','2026-06-30 03:13:29');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `note` text COLLATE utf8mb4_unicode_ci,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(18,2) NOT NULL DEFAULT '0.00',
  `archived` tinyint(1) NOT NULL DEFAULT '0',
  `archived_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'Dự án Mạng WAN','WAN','','2024-10-01','2026-10-31',35068000000.00,0,NULL,'2026-06-26 02:52:44'),(2,'Dự án RMCC','RMCC','','2026-01-01','2026-12-31',1000000000.00,0,NULL,'2026-06-26 02:53:42'),(3,'Dự án Hệ thống ANTT','ANTT','','2026-01-01','2027-12-31',500000000.00,0,NULL,'2026-06-26 02:54:44');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tinh_hinh`
--

DROP TABLE IF EXISTS `tinh_hinh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tinh_hinh` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tinhhinh_item` (`item_id`),
  CONSTRAINT `tinh_hinh_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tinh_hinh`
--

LOCK TABLES `tinh_hinh` WRITE;
/*!40000 ALTER TABLE `tinh_hinh` DISABLE KEYS */;
INSERT INTO `tinh_hinh` VALUES (1,37,'Ngày 24/12/2025, Tổng công ty Phát điện 2 có văn bản số 4726/EVNGENCO2-KHCNCĐS thông qua chủ trương thuê tư vấn lập báo cáo chủ trương đầu tư, báo cáo nghiên cứu khả thi (FS), thẩm tra FS Dự án.','2026-06-26 03:40:49'),(2,37,'Ngày 02/04/2026, Ban QLDA đã lập đề cương, dự toán và điều khoản tham chiếu hạng mục Tư vấn khảo sát, lập Báo cáo đề xuất chủ trương đầu tư, lập Báo cáo nghiên cứu khả thi tại Tờ trình số 82/KTKH ngày 02/04/2026 & đã thẩm định theo Báo cáo thẩm định số 87/KTKH ngày 07/04/2026.','2026-06-26 03:40:59'),(3,37,'Ngày 20/4/2026, Tổng công ty có Văn bản số 1396/EVNGENCO2-KHCNCĐS về việc triển khai định hướng phát triển hệ thống CNTT giai đoạn 2026 - 2031, và thực hiện khảo sát thu thập thông tin phục vụ lập kế hoạch. Trong đó, yêu cầu các đơn vị nghiên cứu và thực hiện rà soát các nhiệm vụ, dự án đang triển khai để lập kế hoạch thực hiện mới phù hợp với định hướng chung của Tập đoàn.','2026-06-26 03:41:12'),(4,37,'Thực hiện chỉ đạo của Tổng công ty tại văn bản trên, hiện Ban QLDA đang thực hiện rà soát dự án để phê duyệt đề cương, dự toán và điều khoản tham chiếu Hạng mục: Tư vấn khảo sát, lập Báo cáo đề xuất chủ trương đầu tư, lập Báo cáo nghiên cứu khả thi, làm cơ sở tổ chức lựa chọn nhà thầu tư vấn đầu tháng 05/2026.','2026-06-26 03:41:23'),(5,6,'- Ngày 2/6/2026, EVNGENCO2, PMB và PECC4 đã ngồi họp rà soát, cam kết tiến độ triển khai (tuy nhiên các mốc tiến độ đến ngày 26/6 là đang chậm 17 ngày so với cam kết).\n- Ngày 8/6/2026, PMB đã có văn bản đôn đốc PECC4 khẩn trương hoàn thiện tại văn bản số 851/GE2PMB-KTAT.\n- Ngày 11/6/2026 – PECC4 có văn bản số 2131/TVĐ4-CNPB gửi PMB sản phẩm báo cáo đxctđt lần 1. PMB cũng đã có văn bản số 886 ngày 11/6 gửi tư vấn 02 thẩm tra.\n- Ngày 19/6/2026 – PECC4 nộp sản phẩm lần 2 tại văn bản số 2245/TVĐ4-CNPB và PMB cũng đã có văn bản số 937 cùng ngày gửi TV02 thẩm tra.\n- Tại văn bản số 965 ngày 23/6 – PMB cũng đã gửi một số ý kiến đối với sản phẩm của PECC4 lần 2\n- Bên cạnh đó, 14h00 hàng ngày Ban KHCNCĐS, PMB và PECC4 để tổ chức họp để rà soát nội dung, tiến độ triển khai. Tuy nhiên, PECC4 vẫn đang trễ hạn tiến độ.','2026-06-26 10:13:11'),(6,6,'-	Sau cuộc họp ngày 26/6, PECC4 đang cam kết ngày 27/6 nộp báo cáo đề xuất chủ trương đầu tư. Ngày 30/6 nộp FS.\n-	Ngày 26/6 – Báo cáo Lãnh đạo Tổng công ty thông qua chủ trương trình HĐQT gộp báo cáo đxctđt và fs dự án 1 lần.','2026-06-26 10:14:16'),(7,6,'Tại báo cáo số 689/KHCNCĐS ngày 26/6/2026, Ban KHCNCĐS và Ban PCKT đã xin Chủ tịch HĐQT và Tổng Giám đốc thông qua chủ trương trình gộp báo cáo đề xuất chủ trương đầu tư và FS dự án','2026-06-30 02:34:39'),(8,6,'Tại văn bản số 2444/EVNGENCO2 ngày 26/6/2026 đã thông báo chương trình làm việc rà soát, đôn đốc tình hình thực hiện RMCC vào 08h30 ngày 1/7/2026','2026-06-30 02:37:43'),(9,1,'Tại vb 977/EVNGENCO2-KHCNCĐS ngày 24/3/2026 \nTổng công ty yêu cầu PMB thực hiện các nội dung sau:\n- Lập đề cương nhiệm vụ, dự toán, TOR các gói thầu tư vấn: (i) Tư vấn 01: Thực hiện khảo sát, lập báo cáo chủ trương đầu tư, lập báo cáo nghiên cứu khả thi dự án Trung tâm điều khiển và giám sát từ xa các nhà máy điện trong EVNGENCO2; (ii) Tư vấn 02: Thực hiện thẩm tra độc lập sản phẩm của Tư vấn 01.\n- PMB khẩn trương triển khai thực hiện và báo cáo về Tổng công ty trước ngày 05/4/2026','2026-06-30 02:42:51'),(10,1,'Tờ trình số 450/TTr- GE2PMB ngày 11/4/2026 của Ban Quản lý dự án Tổng công ty (PMB) về việc phê duyệt đề cương, dự toán và điều khoản tham chiếu gói thầu: Tư vấn khảo sát, lập báo cáo chủ trương đầu tư, lập báo cáo nghiên cứu khả thi (FS); gói thầu: Tư vấn thẩm tra báo cáo đề xuất chủ trương đầu tư, FS Dự án RMCC','2026-06-30 02:44:57'),(11,48,'- Ngày 12/05/2026, PMB đã có thông báo gửi các đơn vị cổ phần và Trung Sơn KQLCNT và ký kết thỏa thuận khung Gói thầu 02.ĐTTT dự án WAN.\n  - Ngày 03/06/2026, PMB gửi các đơn vị cổ phần và Trung Sơn Thỏa thuận khung Gói thầu 02.ĐTTT dự án WAN để triển khai ký kết HĐ với Liên danh T-N-SV-NEX-EMS-VNT.\n  - Ngày 11/06/2026, PMB đã gửi các đơn vị cổ phần và Trung Sơn về nộp bảo đảm thực hiện hợp đồng Gói thầu 02.ĐTTT dự án WAN.\n  - Ngày 12/06/2026, TCT đã có văn bản số 2160/EVNGENCO2-QLĐT góp ý PMB về bảo lãnh thực hiện hợp đồng Gói thầu 02.ĐTTT dự án WAN.\n  - Ngày 15/6/2026, TCT đã có văn bản số 2204/EVNGENCO2-KHCNCĐS gửi PMB về việc rà soát tiến độ dự án mạng WAN. Qua đó yêu cầu PMB khẩn trương rà soát và xây dựng kế hoạch triển khai chi tiết báo cáo về TCT trước 25/6/2026.\nĐối với Khối Cơ quan TCT và các Đơn vị HTPT:\n  - Từ ngày 10/6->18/6/2026 Liên danh nhà thầu đã tiến hành khảo sát tại Cơ quan TCT, các Đơn vị HTPT theo kế hoạch tại văn bản 858/GE2PMB-KTAT ngày 9/6/2026.\n  - Ngày 18/6/2026 PMB đã có văn bản gửi gửi các Trung tâm điều độ A1, A2, A3; Công ty truyền tải điện 2, 3, 4; Công ty điện lực Gia Lai về việc phối hợp khảo sát dự án.\n  - Nhà thầu dự kiến ngày 26/6/2026 sẽ hoàn thành công tác xây dựng nhật ký và báo cáo khảo sát.\nĐối với các Đơn vị CP và TĐ Trung Sơn:\n  - TĐAV: đã hoàn tất ký HĐ và khảo sát.\n  - TĐTM: đã ký HĐ và khảo sát, hiện đang yêu cầu nhà cung cấp bảng tiến độ thực hiện chi tiết.\n  - TĐSBH: đã thương thảo và ký HĐ.\n  - TĐTS: đang trình GĐ ký HĐ.\n  - NĐHP: đã ký HĐ ngày 19/6.\n  - NĐPL: Sau khi rà soát HĐ khung, ngày 12/6 đã có báo cáo số 2745/BC-PPC gửi TCT về sai khác giá trị, phạm vi công việc đối với 2 HĐ khung. Hiện Ban QLĐT đang xem xét --> Chưa ký HĐ','2026-06-30 02:46:16'),(12,47,'- Ngày 19/03/2026, Tổng công ty đã có Quyết định số 91/QĐ-EVNGENCO2 về việc phê duyệt KQLCNT gói Gói thầu 01-ĐTTT: “Tư vấn giám sát công tác triển khai và thẩm tra thiết kế chi tiết” dự án WAN.\n- Ngày 07/05/2026, PMB phê duyệt KQLCNT Gói thầu 02.ĐTTT thuộc dự án WAN.','2026-06-30 02:47:09'),(13,46,'- Ngày 24/06/2025, HĐQT Tổng công ty đã ban hành Quyết định số 99/QĐ-HĐQT về việc phê duyệt điều chỉnh nguồn vốn đầu tư dự án “Nâng cấp hạ tầng mạng truyền dẫn viễn thông phục vụ giám sát và điều hành sản xuất trong toàn Tổng công Phát điện 2”.\n- Ngày 09/07/2025, Tổng công ty đã có văn bản số 2672/EVNGENCO2-KH đôn đốc các Đơn vị cổ phần và Công ty TNHH MTV Trung Sơn hoàn tất việc phê duyệt chủ trương, KHLCNT với nguồn vốn và TMĐT điều chỉnh theo đề xuất ASB2 tại văn bản 272/ASB2-P4 ngày 17/04/2025.\n- Sau khi các ĐVTV hoàn tất việc điều chỉnh và phê duyệt, ngày 22/08/2025 Tổng công ty đã có Quyết định số 291/QĐ-EVNGENCO2 phê duyệt KHLCNT tập trung dự án “Nâng cấp hạ tầng mạng truyền dẫn viễn thông phục vụ giám sát và điều hành sản xuất trong toàn Tổng công Phát điện 2”.','2026-06-30 02:49:55'),(14,45,'Ngày 16/01/2025, Tổng công ty đã có Quyết định số 43/QĐ-EVNGENCO2 về việc phê duyệt BCNCKT dự án “Nâng cấp hạ tầng mạng truyền dẫn viễn thông phục vụ giám sát và điều hành sản xuất trong toàn Tổng công Phát điện 2” do ASB2 trình theo tờ trình số 516/TTr-ASB2 ngày 20/11/2024.','2026-06-30 02:50:22'),(15,44,'- Ngày 06/09/2024, Tổng công ty đã có Quyết định số 302/QĐ-EVNGENCO2 V/v phê duyệt Đề cương nhiệm vụ kỹ thuật, dự toán và điều khoản tham chiếu Tư vấn thẩm tra BCNCKT dự án “Nâng cấp hạ tầng mạng truyền dẫn viễn thông phục vụ giám sát và điều hành sản xuất trong toàn Tổng công ty Phát điện 2”.\n- Ngày 16/09/2024, Tổng công ty đã có Quyết định số 312/QĐ-EVNGENCO2 V/v phê duyệt KHLCNT gói thầu 01 “Thẩm tra BCNCKT dự án Nâng cấp hạ tầng mạng truyền dẫn viễn thông phục vụ giám sát và điều hành sản xuất trong toàn Tổng công ty Phát điện 2”.','2026-06-30 02:50:46'),(16,43,'Ngày 26/08/2024, HĐQT Tổng công ty đã ban hành Quyết định số 129/QĐ-HĐQT về việc phê duyệt chủ trương đầu tư dự án “Nâng cấp hạ tầng mạng truyền dẫn viễn thông phục vụ giám sát và điều hành sản xuất trong toàn Tổng công Phát điện 2”, trong đó giao ASB2 (nay là Ban QLDA EVNGENCO2 – PMB) làm đại diện chủ đầu tư và thực hiện QLDA trong giai đoạn chuẩn bị đầu tư, thực hiện và quyết toán dự án.','2026-06-30 02:51:07'),(17,2,'Ngày 11/4/2026, PMB mới báo cáo kết quả xây dựng đề cương, dự toán, TOR các gói tư vấn (chậm mất 6 ngày). Lãnh đạo giao Ban KH chủ trì, đến ngày 14/4 Ban KH có văn bản 619 chuyển chủ trì (3 ngày).','2026-06-30 02:51:30'),(18,2,'Sau khi xem xét, lấy ý kiến các Ban chức năng, ngày 28/4/2026 tại báo cáo 395/KHCNCĐS đã báo cáo Lãnh đạo TCT thông qua chủ trương giao PMB hiệu chỉnh, bổ sung và quyền phê duyệt các bước tiếp trong việc lựa chọn đơn vị tư vấn.','2026-06-30 02:51:44'),(19,3,'- Ngày 4/5/2026, đã phát hành văn bản 1564 gửi PMB để triển khai.\n“Xem xét tờ trình số 450/TTr- GE2PMB ngày 11/4/2026 của Ban Quản lý dự án Tổng công ty (PMB) về việc phê duyệt đề cương, dự toán và điều khoản tham chiếu gói thầu: Tư vấn khảo sát, lập báo cáo chủ trương đầu tư, lập báo cáo nghiên cứu khả thi (FS); gói thầu: Tư vấn thẩm tra báo cáo đề xuất chủ trương đầu tư, FS Dự án Trung tâm Điều khiển và Giám sát từ xa các nhà máy điện trong EVNGENCO2.\nTổng công ty Phát điện 2 giao Quyền Giám đốc Ban Quản lý dự án EVNGENCO2 thực hiện và chịu trách nhiệm toàn diện các công việc sau: \n- Hiệu chỉnh, hoàn thiện lại Đề cương, Dự toán, TOR 02 gói thầu (i) Tư vấn 01: Thực hiện khảo sát, lập báo cáo chủ trương đầu tư, lập báo cáo nghiên cứu khả thi dự án Trung tâm điều khiển và giám sát từ xa các nhà máy điện trong EVNGENCO2; (ii) Tư vấn 02: Thực hiện thẩm tra độc lập sản phẩm của Tư vấn 01 như các nội dung góp ý tại Phụ lục gửi kèm và tuân thủ các quy định pháp luật hiện hành.\n- Triển khai thuê tư vấn thực hiện 02 gói thầu thầu Tư vấn 01 và Tư vấn 02 nêu trên.\n- Lập, thẩm định và phê duyệt Đề cương, Dự toán, TOR; Lập, thẩm định, phê duyệt KHLCNT; tổ chức LCNT, phê duyệt các bước trong quá trình LCNT và ký kết hợp đồng; quản lý thực hiện hợp đồng theo quy định. Lưu ý đối với nội dung hợp đồng cần quy định rõ phạm vi, giá trị thanh toán, hồ sơ thanh toán cho từng giai đoạn phù hợp (Chủ trương đầu tư, BCNCKT).\nYêu cầu Quyền Giám đốc Ban QLDA EVNGENCO2 căn cứ các nội dung nêu trên để thực hiện đảm bảo tuân thủ đúng quy định hiện hành./.”','2026-06-30 02:54:10'),(20,4,'Ngày 12/5/2025, PMB phê duyệt đề cương, dự toán, TOR tại QĐ số 139/QĐ-GE2PMB','2026-06-30 02:55:19'),(21,5,'- Ngày 30/5/2026, PMB phê duyệt KHLCNT tại QĐ 186\n- Ngày 2/6/2026, PMB phê duyệt KQLCNT và ký hợp đồng với tư vấn 01 PECC4 tại QĐ 199 và số hợp đồng là 23/2026/HĐ-PMB-PECC4 ngày 02/06/2026\n- Ngày 5/6/2026, PMB phê duyệt KQLCNT ký hợp đồng với Tư vấn 02 – Đơn vị thẩm tra sản phẩm của TV01 số 213 và số 24/2026/HĐ-PMB-VIETTEK ngày 05/06/2026','2026-06-30 03:01:16'),(22,51,'I.	Cơ sở thực hiện\nCăn cứ Nghị quyết số 40-NQ/ĐU số 24/9/2025 của Đảng uỷ Tổng công ty về việc Chuyên đề thực hiện Nghị quyết số 57-NQ/TW ngày 22/12/2024 của Bộ Chính trị về đột phá phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số quốc gia trong công tác chuyển đổi số phục vụ công tác quản lý điều hành tập trung tại Tổng công ty Phát điện 2. Trong đó mục tiêu cụ thể chia thành 02 giai đoạn:\n- Giai đoạn 1 (đến năm 2026):\n+ Thực hiện hợp nhất các phân xưởng vận hành trong cùng một đơn vị phát điện thành một phân xưởng để vận hành tập trung. Phấn đấu có ít nhất 2 đơn vị phát điện có thể hoàn thành cơ bản việc giám sát vận hành và điều khiển tập trung.\n+ Cơ bản xây dựng được nền tảng giám sát và phân tích đáp ứng được khoảng 50% số nhà máy đang vận hành, tập trung dữ liệu tại Trung tâm.\n- Giai đoạn 2 (2027 – 2029):\n+ Thực hiện tích hợp điều khiển từ xa thí điểm đối với một nhà máy có điều kiện phù hợp; và cơ bản hoàn thành việc xây dựng nền tảng giám sát và phân tích cho tất các cả nhà máy, hoàn thành trong năm 2027.\n+ Mở rộng và tích hợp điều khiển từ xa đối với các nhà máy điện thuộc các đơn vị trực thuộc có điều kiện phù hợp, hoàn thành trong năm 2028.\n+ Mở rộng và tích hợp điều khiển từ xa đối với các nhà máy điện thuộc đơn vị cổ phần và đơn vị hạch toán độc lập có điều kiện phù hợp, hoàn thành trong năm 2029.','2026-06-30 03:09:09'),(23,51,'II.	Công việc đã triển khai\nThực hiện Nghị quyết số 40-NQ/ĐU số 24/9/2025 nêu trên, Tổ công tác đã khẩn trương nghiên cứu và triển khai thực hiện các nội dung sau:\n- Ngày 13/8/2025 phối hợp với các chuyên gia của Siemens Singapore và ESTEC tổ chức Hội thảo về giải pháp Trung tâm giám sát, vận hành từ xa cho nhà máy điện thuộc EVNGENCO2.\n- Ngày 21/8/2025 phối hợp với KEPCO-KDN (Hàn Quốc) tổ chức Hội thảo về các giải pháp điều khiển và giám sát nhà máy điện.\n- Ngày 15/9/2025, Tổ chỉ đạo và các nhóm trong tổ công tác đã tổ chức họp rà soát, đánh giá công tác triển khai xây dựng Trung tâm ĐK&GS lần 1.\n- Ngày 19/9/2025, Tổng công ty tổ chức tham quan học tập trao đổi kinh nghiệm với Tập đoàn Công nghiệp – Năng lượng Quốc gia Việt Nam về trung tâm giám sát từ xa các nhà máy điện và công tác chuyển đổi số của PVN.\n- Ngày 25/9/2025, Tổng công ty tổ chức tham quan học tập trao đổi kinh nghiệm với Công ty cổ phần Tư vấn xây dựng điện 2 về trung tâm giám sát và điều khiển từ xa các nhà máy điện năng lượng tái tạo.\n- Ngày 26/9/2025, HĐQT Tổng công ty cũng đã có Nghị quyết số 407/NQ-HĐQT về việc thông qua chủ trương làm việc với đối tác nước ngoài của Tổng công ty về việc Hội thảo và nghiên cứu thực địa tại Tập đoàn Điện lực Pháp. Theo đó, Tổng công ty cũng giao Công ty CPTĐ A Vương triển khai các thủ tục hậu cần cho đoàn công tác tại thông báo số 3462/TB-EVNGENCO2 ngày 14/9/2025.\n- Ngày 2/10/2025, phối hợp với AVENUE tổ chức hội thảo: “Trung tâm Giám sát và Chẩn đoán tập trung (MDC)” trong chuyển đổi số vận hành sản xuất.\n- Ngày 7/10/2025, Tổ chỉ đạo và các Ban TH, KH, KT&AT, Ban KHCN&CĐS đã tổ chức họp rà soát, đánh giá công tác triển khai xây dựng Trung tâm ĐK&GS lần 2.\n- Ngày 16/10/2025, Tổng công ty và Viettel Solutions tổ chức Hội thảo chia sẻ kinh nghiệm trong xây dựng Trung tâm Điều khiển và Giám sát từ xa các nhà máy điện.\n- Ngày 22/10/2025, tại tờ trình số 3960/TTr-EVNGENCO2 Tổng Giám đốc Tổng công ty cũng đã trình HĐQT xem xét, có ý kiến đối với chương trình đào tạo và tìm hiểu thực tế tại Pháp và Hà Lan về chiến lược phát triển Trung tâm KĐ&GS và bổ sung chi phí đào tạo năm 2025 cho TĐAV theo đề nghị của Người đại diện EVNGENCO2 tại AVC tại văn bản số 2107/TĐAV-KHVT+TH+HCLĐ+KTAT ngày 18/10/2025. \n- Ngày 23/10/2025, tại Quyết định số 153/QĐ-HĐQT Chủ tịch cũng đã phê duyệt danh sách cán bộ đi công tác nước ngoài tại Pháp và Hà Lan.\n- Ngày 23/10/2025, Tổ công tác trao đổi làm việc với các chuyên gia, kỹ thuật viên của Công ty TNHH Năng lượng Môi trường Biển Đông (ESEC) về các giải pháp công nghệ, mô hình triển khai, công tác bảo mật, …\n- Ngày 29/10/2025, tại Nghị quyết số 429/NQ-HĐQT đã có ý kiến đối với chương trình đào tạo và tìm hiểu thực tế tại Cộng hoà Pháp và Cộng hoà Hà Lan về chiến lược phát triển trung tâm giám sát và điều khiển từ xa các nhà máy điện và bổ sung chi phí đào tạo năm 2025 của Công ty CPTĐ A Vương.\n- Ngày 29/10/2025, tại văn bản số 4050/EVNGENCO2-KHCN&CĐS+TH Tổng công ty đã chỉ đạo các Đơn vị triển khai Nghị quyết số 429/NQ-HĐQT nêu trên.\n- Ngày 6/11/2025, Tổ chức hội thảo với Công ty TNHH Kỹ thuật Hoa Vi (Huawei Technologies Co., Ltd) về các giải pháp nhà máy điện thông minh.\n- Ngày 11/11/2025, EVN có văn bản số 7210/EVN-KTAT  - Trong đó giao các Tổng công ty Phát điện Nghiên cứu, xây dựng Đề án OCC để điều khiển tập trung các nhà máy thuỷ điện, nhà máy nhiệt điện và nhà máy điện năng lượng tái tạo\n- Ngày 11/11/2025, tổ chức hội thảo với Andrizt Việt Nam về giới thiệu các giải pháp điều khiển giám sát tập trung (OCC) và Tự động chuẩn đoán tình trạng thiết bị công nghệ (DiOMera Predictive).\n- Ngày 11/11/2025, Tổ chức hội thảo với VietStar và KPMG về giới thiệu các giải pháp xây dựng Trung tâm điều khiển và giám sát từ xa các nhà máy điện.\n- Từ ngày 12/11 đến ngày 23/11/2025, Đoàn công tác của EVNGENCO2 đã đi công tại Cộng hoà Pháp và Cộng hoà Hà Lan để tham gia chương trình đào tạo và tìm hiểu thực tế về chiến lược phát triển trung tâm giám sát và điều khiển từ xa cho nhà máy điện.\n- Ngày 14/11/2025, tham gia hội thảo với Công  ty  TNHH  Quốc  tế  Lan Thương-Mê Kông thuộc Tập đoàn Lưới điện Phương Nam, Trung Quốc (CSG-LMI) về việc xây dựng Trung tâm Điều khiển và Giám sát từ xa các nhà máy điện trong EVNGENCO2.\n- Ngày 2/12/2025, Đoàn công tác đã thực hiện báo cáo Ban Thường vụ Đảng uỷ, HĐQT, Tổng Giám đốc Tổng công ty kết quả nội dung chuyến đi công tác nước ngoài tại Cộng hoà Pháp và Cộng hoà Hà Lan.\n- Tại báo cáo số 4512/BC-EVNGENCO2 ngày 3/12/2025 Đoàn công tác thực hiện báo cáo Đảng uỷ, HĐQT, Tổng Giám đốc Tổng công ty kết quả đi công tác nước ngoài tham gia chương trình đào tạo và tìm hiểu thực tế tại Cộng hoà Pháp và Cộng hoà Hà Lan về chiến lược phát triển trung tâm giám sát và điều khiển từ xa cho nhà máy điện.\n- Ngày 4/12/2025, EVN có văn bản số 7758/EVN-TCNS về việc định biên lao động CBSX dự án NMĐG Hướng phùng 1 – Trong đó, giao EVNGENCO2 nghiên cứu triển khai trung tâm ĐK&GS các nhà máy điện để quản lý vận hành NMTĐ Quảng Trị và NMĐG Hướng Phùng 1, trong đó thiết kế, xây dựng, bổ sung các hệ thống giám sát, bảo vệ, điều khiển để đảm bảo vận hành NMĐG Hướng phùng 1 theo cơ chế không người trực.\n- Ngày 25/12/2025, Tổ chức Hội thảo với Công  ty  TNHH  Quốc  tế  Lan Thương-Mê Kông thuộc Tập đoàn Lưới điện Phương Nam, Trung Quốc về việc triển khai xây dựng Trung tâm.\n- Ngày 25/12/2025, tại tờ trình số 496/KHCNCĐS về việc báo cáo Chủ tịch và Tổng Giám đốc về việc gửi thư cảm ơn và đề xuất tăng cường hợp tác với CNR.\n- Ngày 5/1/2026, Tổng công ty đã gửi thư cảm ơn và đề xuất hợp tác tới CNR – thư do phó TGĐ Ngô Việt Hưng ký gửi.\n- Ngày 14/1/2026, CNR có phản hồi.\n- Ngày ngày 19/1/2026, tại báo cáo số 67/KHCNCĐS có báo cáo Chủ tịch và Tổng Giám đốc về việc phản hồi của CNR và đề xuất cho phép tiếp tục trao đổi chuyên môn với các chuyên gia của CNR và theo dõi cập nhật thời điểm điểm ký MoU phù hợp và đề xuất CNR giới thiệu cho EVNGENCO2 đơn vị đã tư vấn cho CNR.\n- Ngày 22/1/2026, Tổng công ty tổ chức hội thảo với công ty của Trung Quốc (Beijing Fidelity Power Technology Development Co. Ltd) về việc triển khai xây dựng Trung tâm Đk&GS từ xa các nhà máy điện.\n- Ngày 29/1/2026, tại Quyết định số 46/QĐ-EVNGENCO2 về việc tạm giao kế hoạch đầu tư xây dựng năm 2026 do Ban QLDA EVNGENCO2 có dự án RMCC.\n- Ngày 2/3/2026, tại Quyết định số 74/QĐ-EVNGENCO2 đã giao tiến độ tổng thể dự án RMCC.\n- Ngày 10/3/2026 – Phát hành văn bản gửi các Đơn vị phục vụ công tác khảo sát.\n- Ngày 10/3/2025 – Trình Lãnh đạo Tổng công ty thông qua chủ trương giao PMB triển khai thuê các Đơn vị tư vấn 01 và 02. Theo đó, PTGĐ – Lê Quốc Vũ đã chỉ đạo yêu cầu PMB lập đề cương, dự toán TOR gửi Tổng công ty xem xét có ý kiến trước.\n- Ngày 24/3/2026 - tại văn bản số 977/EVNGENCO2-KHCNCĐS đã yêu cầu PMB lập đề cương, dự toán, TOR gửi về Tổng công ty trước ngày 5/4/2026 để xem xét.\n- Ngày 24/3/2025 Đã trao đổi làm việc với công ty CNR - Cộng hoà Pháp để hỗ trợ Tổng công ty về mặt kỹ thuật và kinh nghiệm trong việc triển khai xây dựng RMCC\n- Ngày 25/3/2026 đã báo cáo Lãnh đạo Tổng công ty kết quả làm việc với CNR tại báo cáo số 259/KHCNCĐS.\n- Ngày 6/4/2026, Ban cũng đã báo cáo Lãnh đạo Tổng công ty việc triển khai xây dựng, vận hành Trung tâm điều khiển và giám sát từ xa các nhà máy điện trong EVNGENCO2\n-  Ngày 11/4/2026, PMB mới báo cáo kết quả xây dựng đề cương, dự toán, TOR các gói tư vấn (chậm mất 6 ngày). Lãnh đạo giao Ban KH chủ trì, đến ngày 14/4 Ban KH mới có văn bản chuyển chủ trì (3 ngày). \n- Sau khi xem xét, lấy ý kiến các Ban chức năng, ngày 28/4/2026 tại báo cáo 395/KHCNCĐS đã báo cáo Lãnh đạo TCT thông qua chủ trương giao PMB hiệu chỉnh, bổ sung và quyền phê duyệt các bước tiếp trong việc lựa chọn đơn vị tư vấn.\n- Ngày 4/5/2026, đã phát hành văn bản gửi PMB để triển khai.\n- Ngày 12/5/2025, PMB phê duyệt đề cương, dự toán, TOR tại QĐ 139\n- Ngày 30/5/2026, PMB phê duyệt KHLCNT tại QĐ 186\n- Ngày 2/6/2026, PMB phê duyệt KQLCNT và ký hợp đồng với tư vấn 01 PECC4 tại QĐ 199 và số hợp đồng là 23/2026/HĐ-PMB-PECC4 ngày 02/06/2026\n- Ngày 5/6/2026, PMB phê duyệt KQLCNT ký hợp đồng với Tư vấn 02 – Đơn vị thẩm tra sản phẩm của TV01 số 213 và số 24/2026/HĐ-PMB-VIETTEK ngày 05/06/2026\n- Ngày 29/5 - Tổ chỉ đạo họp rà soát và chỉ đạo công tác triển khai dự án.\n- Ngày 2/6/2026, EVNGENCO2, PMB và PECC4 đã ngồi họp rà soát, cam kết tiến độ triển khai (tuy nhiên các mốc tiến độ đến ngày 26/6 là đang chậm 17 ngày so với cam kết).\n- Ngày 8/6/2026, PMB đã có văn bản đôn đốc PECC4 khẩn trương hoàn thiện tại văn bản số 851/GE2PMB-KTAT.\n- Ngày 11/6/2026 – PECC4 có văn bản số 2131/TVĐ4-CNPB gửi PMB sản phẩm báo cáo đxctđt lần 1. PMB cũng đã có văn bản số 886 ngày 11/6 gửi tư vấn 02 thẩm tra.\n- Ngày 19/6/2026 – PECC4 nộp sản phẩm lần 2 tại văn bản số 2245/TVĐ4-CNPB và PMB cũng đã có văn bản số 937 cùng ngày gửi TV02 thẩm tra.\n- Tại văn bản số 965 ngày 23/6 – PMB cũng đã gửi một số ý kiến đối với sản phẩm của PECC4 lần 2\n- Bên cạnh đó, 14h00 hàng ngày Ban KHCNCĐS, PMB và PECC4 để tổ chức họp để rà soát nội dung, tiến độ triển khai. Tuy nhiên, PECC4 vẫn đang trễ hạn tiến độ.\n- Các cuộc hội thảo về giải pháp xây dựng RMCC, thì Tổng công ty có phối hợp tổ chức gồm có:\n+ 6/3: Hội thảo với CSGI.\n+ 24/3: Hội thảo với CNR.\n+ 6/4: Hội thảo với ESEC và Andrizt.\n+ 23/4: Hội thảo với Safe-Fire.\n+ 24/4: Hội thảo với IDPP-KEPCO\n+ 13-14/5: Tổ chức đạo tạo về kiến trúc RMCC\n+ 19/5: Tổ chức hội thảo với BHEV\n+ 20/5: Hội thảo với AZVISION\n+ 27/5: Hội thảo với S5T.\n+ 16/6: Hội thảo với Mig Việt\n\n-	Hiện nay, PECC4 đang cam kết ngày 27/6 nộp báo cáo đề xuất chủ trương đầu tư. Ngày 30/6 nộp FS.\n-	Ngày 26/6 – Báo cáo Lãnh đạo Tổng công ty thông qua chủ trương trình HĐQT gộp báo cáo đxctđt và fs dự án 1 lần.','2026-06-30 03:13:29'),(24,37,'Ngày 20/6/2026 tại Quyết định số 262/QĐ-GE2PMB đã phê duyệt KHLCNT đợt 1 dự án nêu trên. \nNgày 26/6/2026, PMB đã ký hợp đồng với Đơn vị tư vấn Công ty CP Dịch vụ CNTT HPT để thực hiện khảo sát, lập báo cáo chủ trương đầu tư, lập báo cáo nghiên cứu khả thi dự án. Hợp đồng số 25/2026/HĐ-PMB-HPT ngày 26/6/2026','2026-06-30 03:22:28'),(25,37,'Cty CPDV CNTT HPT (tư vấn)','2026-06-30 03:24:42'),(26,6,'Ngày 1/7/2026 tại cuộc họp PECC4 sẽ gửi lại bản dự thảo trước 17h00 ngày 1/7/2026.','2026-07-01 04:57:26'),(27,6,'Gửi lại bản dự thảo cho các Ban /đơn vị góp ý gửi về trước 17h00 ngày 2/7','2026-07-01 04:57:59'),(28,6,'Ngày 4/7/2026 - PECC4 và Ban KHCNCĐS đã tổ chức họp trực tiếp tại Phòng Sông Bung - để rà soát các nội dung trong FS góp ý để PMB hiệu chỉnh. \n- Mặt bằng đặt phòng RMCC là phòng Phả Lại bên tòa nhà các Ban Đảng và Data Center','2026-07-07 03:14:37');
/*!40000 ALTER TABLE `tinh_hinh` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `disabled` tinyint(1) NOT NULL DEFAULT '0',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$x5Wo4qwMtYty.o0COYN3AOKWA/DHZ879hQJclT6Q.nM30PYa4FEHu','Quản trị viên','admin',0,1,'2026-07-08 14:24:52');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'pman'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-08 15:27:17
