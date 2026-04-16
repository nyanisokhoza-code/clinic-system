import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  longtext,
  tinyint,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Supports both patients and staff (doctors, nurses, dispensary staff, admin).
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "doctor", "nurse", "dispensary_staff", "clinic_manager"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Patient profiles - core entity for patient management
 * South African ID is the unique identifier across the entire system
 */
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  saIdNumber: varchar("saIdNumber", { length: 13 }).notNull().unique(), // South African ID
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  emergencyContactName: varchar("emergencyContactName", { length: 100 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 20 }),
  bloodType: varchar("bloodType", { length: 5 }), // A+, A-, B+, B-, O+, O-, AB+, AB-
  allergies: json("allergies"), // Array of allergy objects: { allergen, severity, reaction }
  chronicConditions: json("chronicConditions"), // Array of chronic conditions: { condition, diagnosisDate, status }
  medications: json("medications"), // Array of current medications: { name, dosage, frequency, prescribedDate }
  insuranceProvider: varchar("insuranceProvider", { length: 100 }),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 100 }),
  registrationDate: timestamp("registrationDate").defaultNow().notNull(),
  lastVisitDate: timestamp("lastVisitDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

/**
 * Medical history - tracks all patient consultations and treatments
 */
export const medicalHistory = mysqlTable("medicalHistory", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  visitDate: timestamp("visitDate").defaultNow().notNull(),
  department: varchar("department", { length: 100 }).notNull(), // e.g., "General", "Cardiology", "Pediatrics"
  chiefComplaint: text("chiefComplaint"),
  symptoms: json("symptoms"), // Array of symptoms reported
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatmentPlan"),
  notes: longtext("notes"),
  doctorId: int("doctorId"),
  vitals: json("vitals"), // { bloodPressure, temperature, heartRate, respiratoryRate, weight, height }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type InsertMedicalHistory = typeof medicalHistory.$inferInsert;

/**
 * Clinics - hospital and clinic locations for decentralized medication collection
 */
export const clinics = mysqlTable("clinics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", ["hospital", "clinic", "collection_point"]).notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  operatingHours: json("operatingHours"), // { monday: { open, close }, ... }
  managerId: int("managerId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = typeof clinics.$inferInsert;

/**
 * Queue management - tracks patient queue status in real-time
 */
export const queues = mysqlTable("queues", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  clinicId: int("clinicId").notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  queueNumber: int("queueNumber").notNull(),
  status: mysqlEnum("status", ["waiting", "in_progress", "completed", "no_show", "cancelled"]).default("waiting").notNull(),
  checkInTime: timestamp("checkInTime").defaultNow().notNull(),
  estimatedWaitTime: int("estimatedWaitTime"), // in minutes
  callTime: timestamp("callTime"),
  completionTime: timestamp("completionTime"),
  priority: mysqlEnum("priority", ["routine", "urgent", "emergency"]).default("routine").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Queue = typeof queues.$inferSelect;
export type InsertQueue = typeof queues.$inferInsert;

/**
 * Consultations - digital consultation records
 */
export const consultations = mysqlTable("consultations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  doctorId: int("doctorId").notNull(),
  clinicId: int("clinicId").notNull(),
  consultationDate: timestamp("consultationDate").defaultNow().notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  chiefComplaint: text("chiefComplaint"),
  symptoms: json("symptoms"),
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatmentPlan"),
  notes: longtext("notes"),
  vitals: json("vitals"),
  status: mysqlEnum("status", ["in_progress", "completed", "cancelled"]).default("in_progress").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = typeof consultations.$inferInsert;

/**
 * Prescriptions - digital prescriptions routed directly to dispensary
 */
export const prescriptions = mysqlTable("prescriptions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  consultationId: int("consultationId"),
  doctorId: int("doctorId").notNull(),
  clinicId: int("clinicId").notNull(),
  collectionClinicId: int("collectionClinicId"), // Where patient will collect medication
  prescriptionDate: timestamp("prescriptionDate").defaultNow().notNull(),
  medications: json("medications").notNull(), // Array of { name, dosage, frequency, quantity, duration, instructions }
  status: mysqlEnum("status", ["pending", "ready", "dispensed", "cancelled"]).default("pending").notNull(),
  dispenseTime: timestamp("dispenseTime"),
  dispensedBy: int("dispensedBy"), // Dispensary staff ID
  notes: text("notes"),
  isRepeat: boolean("isRepeat").default(false),
  repeatCount: int("repeatCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

/**
 * Medication inventory - tracks stock at each clinic/collection point
 */
export const medicationInventory = mysqlTable("medicationInventory", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  medicationName: varchar("medicationName", { length: 200 }).notNull(),
  quantity: int("quantity").notNull().default(0),
  minimumThreshold: int("minimumThreshold").notNull().default(10),
  unit: varchar("unit", { length: 20 }), // e.g., "tablets", "ml", "units"
  expiryDate: timestamp("expiryDate"),
  lastRestockedDate: timestamp("lastRestockedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicationInventory = typeof medicationInventory.$inferSelect;
export type InsertMedicationInventory = typeof medicationInventory.$inferInsert;

/**
 * Notifications - tracks all patient notifications (SMS, in-app, push)
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  type: mysqlEnum("type", ["sms", "in_app", "push", "email"]).notNull(),
  channel: varchar("channel", { length: 50 }), // e.g., "queue_called", "prescription_ready", "appointment_confirmed"
  title: varchar("title", { length: 200 }),
  message: text("message").notNull(),
  recipientPhone: varchar("recipientPhone", { length: 20 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  status: mysqlEnum("status", ["pending", "sent", "failed", "read"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Audit logs - POPIA compliance tracking for all data access
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  patientId: int("patientId"),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "view_patient", "create_prescription", "access_medical_history"
  resource: varchar("resource", { length: 100 }).notNull(), // e.g., "patient", "prescription", "consultation"
  resourceId: int("resourceId"),
  details: json("details"), // Additional context about the action
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * AI intake assessments - logs from AI symptom intake assistant
 */
export const aiIntakeAssessments = mysqlTable("aiIntakeAssessments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  clinicId: int("clinicId").notNull(),
  symptoms: json("symptoms").notNull(), // Array of symptoms reported by patient
  aiResponse: longtext("aiResponse"), // Full AI response
  recommendedDepartment: varchar("recommendedDepartment", { length: 100 }),
  recommendedUrgency: mysqlEnum("recommendedUrgency", ["routine", "urgent", "emergency"]).default("routine"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  acceptedByStaff: boolean("acceptedByStaff"),
  finalDepartment: varchar("finalDepartment", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIIntakeAssessment = typeof aiIntakeAssessments.$inferSelect;
export type InsertAIIntakeAssessment = typeof aiIntakeAssessments.$inferInsert;

/**
 * Analytics - aggregated metrics for performance tracking
 */
export const analyticsMetrics = mysqlTable("analyticsMetrics", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(),
  date: timestamp("date").notNull(),
  totalPatientsVisited: int("totalPatientsVisited").default(0),
  averageWaitTime: int("averageWaitTime"), // in minutes
  averageConsultationTime: int("averageConsultationTime"), // in minutes
  prescriptionsIssued: int("prescriptionsIssued").default(0),
  prescriptionsDispensed: int("prescriptionsDispensed").default(0),
  noShowCount: int("noShowCount").default(0),
  emergencyCaseCount: int("emergencyCaseCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsMetrics = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetrics = typeof analyticsMetrics.$inferInsert;

/**
 * Vital signs checklist - tracks individual vital sign checks for Step 2
 * Each vital sign (BP, temperature, HIV/AIDS test, etc.) is tracked independently
 */
export const vitalSignsChecklist = mysqlTable("vitalSignsChecklist", {
  id: int("id").autoincrement().primaryKey(),
  queueId: int("queueId").notNull(),
  patientId: int("patientId").notNull(),
  clinicId: int("clinicId").notNull(),
  vitalType: mysqlEnum("vitalType", [
    "blood_pressure",
    "temperature",
    "heart_rate",
    "respiratory_rate",
    "weight",
    "height",
    "hiv_aids_test",
    "oxygen_saturation",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  assignedNurseId: int("assignedNurseId"),
  assignedRoom: varchar("assignedRoom", { length: 50 }), // e.g., "Room 101"
  value: varchar("value", { length: 100 }), // e.g., "120/80" for BP, "37.5" for temp
  unit: varchar("unit", { length: 20 }), // e.g., "mmHg", "°C", "bpm"
  notes: text("notes"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VitalSignsChecklist = typeof vitalSignsChecklist.$inferSelect;
export type InsertVitalSignsChecklist = typeof vitalSignsChecklist.$inferInsert;

/**
 * Medication collection station - tracks patient presence and collection workflow at dispensary
 */
export const medicationCollectionStation = mysqlTable("medicationCollectionStation", {
  id: int("id").autoincrement().primaryKey(),
  prescriptionId: int("prescriptionId").notNull(),
  patientId: int("patientId").notNull(),
  clinicId: int("clinicId").notNull(),
  status: mysqlEnum("status", [
    "awaiting_arrival",
    "patient_arrived",
    "verified",
    "preparing",
    "ready_for_collection",
    "collected",
    "cancelled",
  ]).default("awaiting_arrival").notNull(),
  ticketNumber: varchar("ticketNumber", { length: 50 }),
  patientIdVerified: boolean("patientIdVerified").default(false),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"), // Staff member ID
  preparationStartedAt: timestamp("preparationStartedAt"),
  readyForCollectionAt: timestamp("readyForCollectionAt"),
  collectedAt: timestamp("collectedAt"),
  estimatedWaitTime: int("estimatedWaitTime"), // in minutes
  actualWaitTime: int("actualWaitTime"), // in minutes
  pharmacistInstructions: text("pharmacistInstructions"),
  redirectedToClinicId: int("redirectedToClinicId"), // If redirected to nearest clinic
  redirectReason: varchar("redirectReason", { length: 200 }), // e.g., "Wait time > 60 minutes"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicationCollectionStation = typeof medicationCollectionStation.$inferSelect;
export type InsertMedicationCollectionStation = typeof medicationCollectionStation.$inferInsert;
