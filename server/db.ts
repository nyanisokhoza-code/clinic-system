import { eq, desc, and, like, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, patients, medicalHistory, consultations, prescriptions, queues, notifications, auditLogs, clinics } from "../drizzle/schema";
import { ENV } from './_core/env';
import { mockDatabase } from './services/mockDatabase';

let _db: ReturnType<typeof drizzle> | null = null;
let _useMockDb = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      _useMockDb = false;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _useMockDb = true;
    }
  } else if (!_db && !process.env.DATABASE_URL) {
    console.log("[Database] DATABASE_URL not set. Using mock database for development.");
    _useMockDb = true;
  }
  return _db;
}

export function isMockDatabase() {
  return _useMockDb;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PATIENT MANAGEMENT
// ============================================================================

export async function createPatient(patientData: typeof patients.$inferInsert) {
  const db = await getDb();
  if (!db) {
    if (_useMockDb) {
      const mockPatient = await mockDatabase.registerPatient({
        saIdNumber: patientData.saIdNumber,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        dateOfBirth: patientData.dateOfBirth || undefined,
        gender: patientData.gender || undefined,
        phone: patientData.phone || undefined,
        email: patientData.email || undefined,
        address: patientData.address || undefined,
        emergencyContactName: patientData.emergencyContactName || undefined,
        emergencyContactPhone: patientData.emergencyContactPhone || undefined,
        bloodType: patientData.bloodType || undefined,
      });
      return { insertId: parseInt(mockPatient.id.split('_')[1]) || 1 };
    }
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(patients).values(patientData);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create patient:", error);
    throw error;
  }
}

export async function getPatientBySAId(saIdNumber: string) {
  const db = await getDb();
  if (!db) {
    if (_useMockDb) {
      const patient = await mockDatabase.getPatientBySAId(saIdNumber);
      if (patient) {
        return {
          id: parseInt(patient.id.split('_')[1]) || 1,
          saIdNumber: patient.saIdNumber,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth || null,
          gender: patient.gender || null,
          phone: patient.phone || null,
          email: patient.email || null,
          address: patient.address || null,
          emergencyContactName: patient.emergencyContactName || null,
          emergencyContactPhone: patient.emergencyContactPhone || null,
          bloodType: patient.bloodType || null,
          allergies: null,
          chronicConditions: null,
          medications: null,
          isActive: true,
          createdAt: patient.createdAt,
          updatedAt: patient.createdAt,
        };
      }
    }
    return undefined;
  }

  const result = await db.select().from(patients).where(eq(patients.saIdNumber, saIdNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPatientById(patientId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePatient(patientId: number, updates: Partial<typeof patients.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(patients).set(updates).where(eq(patients.id, patientId));
}

export async function searchPatients(query: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(patients)
    .where(
      and(
        eq(patients.isActive, true),
        like(patients.firstName, `%${query}%`)
      )
    )
    .limit(limit);
}

// ============================================================================
// MEDICAL HISTORY
// ============================================================================

export async function createMedicalHistoryRecord(record: typeof medicalHistory.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(medicalHistory).values(record);
}

export async function getPatientMedicalHistory(patientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(medicalHistory)
    .where(eq(medicalHistory.patientId, patientId))
    .orderBy(desc(medicalHistory.visitDate))
    .limit(limit);
}

// ============================================================================
// CONSULTATIONS
// ============================================================================

export async function createConsultation(consultation: typeof consultations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(consultations).values(consultation);
}

export async function getConsultationById(consultationId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateConsultation(consultationId: number, updates: Partial<typeof consultations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(consultations).set(updates).where(eq(consultations.id, consultationId));
}

// ============================================================================
// PRESCRIPTIONS
// ============================================================================

export async function createPrescription(prescription: typeof prescriptions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(prescriptions).values(prescription);
}

export async function getPrescriptionById(prescriptionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(prescriptions).where(eq(prescriptions.id, prescriptionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPatientPrescriptions(patientId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId))
    .orderBy(desc(prescriptions.prescriptionDate))
    .limit(limit);
}

export async function updatePrescription(prescriptionId: number, updates: Partial<typeof prescriptions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(prescriptions).set(updates).where(eq(prescriptions.id, prescriptionId));
}

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

export async function createQueueEntry(queueEntry: typeof queues.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(queues).values(queueEntry);
}

export async function getQueueById(queueId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(queues).where(eq(queues.id, queueId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateQueueEntry(queueId: number, updates: Partial<typeof queues.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(queues).set(updates).where(eq(queues.id, queueId));
}

export async function getClinicQueue(clinicId: number, department: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(queues)
    .where(
      and(
        eq(queues.clinicId, clinicId),
        eq(queues.department, department),
        eq(queues.status, "waiting")
      )
    )
    .orderBy(queues.queueNumber);
}

export async function getPatientCurrentQueue(patientId: number, clinicId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(queues)
    .where(
      and(
        eq(queues.patientId, patientId),
        eq(queues.clinicId, clinicId),
        eq(queues.status, "waiting")
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getNextQueueNumber(clinicId: number, department: string): Promise<number> {
  const db = await getDb();
  if (!db) return 1;

  const result = await db
    .select()
    .from(queues)
    .where(
      and(
        eq(queues.clinicId, clinicId),
        eq(queues.department, department)
      )
    )
    .orderBy(desc(queues.queueNumber))
    .limit(1);

  return result.length > 0 ? (result[0].queueNumber || 0) + 1 : 1;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function createNotification(notification: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notifications).values(notification);
}

export async function getPatientNotifications(patientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.patientId, patientId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function updateNotification(notificationId: number, updates: Partial<typeof notifications.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(notifications).set(updates).where(eq(notifications.id, notificationId));
}

// ============================================================================
// CLINICS
// ============================================================================

export async function getAllClinics() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(clinics).where(eq(clinics.isActive, true));
}

export async function getClinicById(clinicId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// AUDIT LOGGING (POPIA COMPLIANCE)
// ============================================================================

export async function logAuditEvent(auditEntry: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Cannot log audit event: database not available");
    return;
  }

  try {
    await db.insert(auditLogs).values(auditEntry);
  } catch (error) {
    console.error("[Audit] Failed to log audit event:", error);
  }
}
