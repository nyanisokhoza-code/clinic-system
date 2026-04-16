CREATE TABLE `aiIntakeAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`clinicId` int NOT NULL,
	`symptoms` json NOT NULL,
	`aiResponse` longtext,
	`recommendedDepartment` varchar(100),
	`recommendedUrgency` enum('routine','urgent','emergency') DEFAULT 'routine',
	`confidence` decimal(3,2),
	`acceptedByStaff` boolean,
	`finalDepartment` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiIntakeAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyticsMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`date` timestamp NOT NULL,
	`totalPatientsVisited` int DEFAULT 0,
	`averageWaitTime` int,
	`averageConsultationTime` int,
	`prescriptionsIssued` int DEFAULT 0,
	`prescriptionsDispensed` int DEFAULT 0,
	`noShowCount` int DEFAULT 0,
	`emergencyCaseCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int,
	`action` varchar(100) NOT NULL,
	`resource` varchar(100) NOT NULL,
	`resourceId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('hospital','clinic','collection_point') NOT NULL,
	`address` text NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`phone` varchar(20),
	`email` varchar(320),
	`operatingHours` json,
	`managerId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`doctorId` int NOT NULL,
	`clinicId` int NOT NULL,
	`consultationDate` timestamp NOT NULL DEFAULT (now()),
	`department` varchar(100) NOT NULL,
	`chiefComplaint` text,
	`symptoms` json,
	`diagnosis` text,
	`treatmentPlan` text,
	`notes` longtext,
	`vitals` json,
	`status` enum('in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicalHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`visitDate` timestamp NOT NULL DEFAULT (now()),
	`department` varchar(100) NOT NULL,
	`chiefComplaint` text,
	`symptoms` json,
	`diagnosis` text,
	`treatmentPlan` text,
	`notes` longtext,
	`doctorId` int,
	`vitals` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicalHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicationInventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`medicationName` varchar(200) NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`minimumThreshold` int NOT NULL DEFAULT 10,
	`unit` varchar(20),
	`expiryDate` timestamp,
	`lastRestockedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicationInventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`type` enum('sms','in_app','push','email') NOT NULL,
	`channel` varchar(50),
	`title` varchar(200),
	`message` text NOT NULL,
	`recipientPhone` varchar(20),
	`recipientEmail` varchar(320),
	`status` enum('pending','sent','failed','read') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saIdNumber` varchar(13) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`dateOfBirth` timestamp,
	`gender` enum('male','female','other'),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`emergencyContactName` varchar(100),
	`emergencyContactPhone` varchar(20),
	`bloodType` varchar(5),
	`allergies` json,
	`chronicConditions` json,
	`medications` json,
	`insuranceProvider` varchar(100),
	`insurancePolicyNumber` varchar(100),
	`registrationDate` timestamp NOT NULL DEFAULT (now()),
	`lastVisitDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `patients_saIdNumber_unique` UNIQUE(`saIdNumber`)
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`consultationId` int,
	`doctorId` int NOT NULL,
	`clinicId` int NOT NULL,
	`collectionClinicId` int,
	`prescriptionDate` timestamp NOT NULL DEFAULT (now()),
	`medications` json NOT NULL,
	`status` enum('pending','ready','dispensed','cancelled') NOT NULL DEFAULT 'pending',
	`dispenseTime` timestamp,
	`dispensedBy` int,
	`notes` text,
	`isRepeat` boolean DEFAULT false,
	`repeatCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prescriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `queues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`clinicId` int NOT NULL,
	`department` varchar(100) NOT NULL,
	`queueNumber` int NOT NULL,
	`status` enum('waiting','in_progress','completed','no_show','cancelled') NOT NULL DEFAULT 'waiting',
	`checkInTime` timestamp NOT NULL DEFAULT (now()),
	`estimatedWaitTime` int,
	`callTime` timestamp,
	`completionTime` timestamp,
	`priority` enum('routine','urgent','emergency') NOT NULL DEFAULT 'routine',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `queues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','doctor','nurse','dispensary_staff','clinic_manager') NOT NULL DEFAULT 'user';