/**
 * Mock Database Service
 * Provides in-memory database functionality for development and testing
 * without requiring a real database connection
 */

interface Patient {
  id: string;
  saIdNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  createdAt: Date;
}

interface QueueEntry {
  id: string;
  patientId: string;
  status: "waiting" | "vitals" | "consultation" | "dispensary" | "completed";
  checkInTime: Date;
  completedAt?: Date;
}

interface VitalSign {
  id: string;
  queueId: string;
  patientId: string;
  vitalType: string;
  value: string;
  unit?: string;
  recordedAt: Date;
  recordedBy?: string;
}

interface Consultation {
  id: string;
  patientId: string;
  queueId: string;
  doctorNotes?: string;
  diagnosis?: string;
  prescription?: string;
  consultedAt: Date;
}

// In-memory storage
let patients: Map<string, Patient> = new Map();
let queueEntries: Map<string, QueueEntry> = new Map();
let vitalSigns: Map<string, VitalSign> = new Map();
let consultations: Map<string, Consultation> = new Map();

// Counters for ID generation
let patientCounter = 1;
let queueCounter = 1;
let vitalCounter = 1;
let consultationCounter = 1;

export const mockDatabase = {
  // Patient operations
  async registerPatient(data: Omit<Patient, "id" | "createdAt">): Promise<Patient> {
    // Check if patient already exists
    const existing = Array.from(patients.values()).find(
      (p) => p.saIdNumber === data.saIdNumber
    );
    if (existing) {
      throw new Error("Patient with this SA ID already exists");
    }

    const patient: Patient = {
      id: `patient_${patientCounter++}`,
      ...data,
      createdAt: new Date(),
    };

    patients.set(patient.id, patient);
    console.log(`[MockDB] Patient registered: ${patient.id}`);
    return patient;
  },

  async getPatientBySAId(saIdNumber: string): Promise<Patient | null> {
    const patient = Array.from(patients.values()).find(
      (p) => p.saIdNumber === saIdNumber
    );
    return patient || null;
  },

  async getPatientById(patientId: string): Promise<Patient | null> {
    return patients.get(patientId) || null;
  },

  // Queue operations
  async addToQueue(patientId: string): Promise<QueueEntry> {
    const queueEntry: QueueEntry = {
      id: `queue_${queueCounter++}`,
      patientId,
      status: "waiting",
      checkInTime: new Date(),
    };

    queueEntries.set(queueEntry.id, queueEntry);
    console.log(`[MockDB] Patient added to queue: ${queueEntry.id}`);
    return queueEntry;
  },

  async getQueueEntry(queueId: string): Promise<QueueEntry | null> {
    return queueEntries.get(queueId) || null;
  },

  async updateQueueStatus(
    queueId: string,
    status: QueueEntry["status"]
  ): Promise<QueueEntry> {
    const entry = queueEntries.get(queueId);
    if (!entry) {
      throw new Error("Queue entry not found");
    }

    entry.status = status;
    if (status === "completed") {
      entry.completedAt = new Date();
    }

    queueEntries.set(queueId, entry);
    return entry;
  },

  async getPatientQueue(patientId: string): Promise<QueueEntry | null> {
    const entry = Array.from(queueEntries.values()).find(
      (q) => q.patientId === patientId
    );
    return entry || null;
  },

  // Vital signs operations
  async recordVitalSign(data: Omit<VitalSign, "id" | "recordedAt">): Promise<VitalSign> {
    const vital: VitalSign = {
      id: `vital_${vitalCounter++}`,
      ...data,
      recordedAt: new Date(),
    };

    vitalSigns.set(vital.id, vital);
    console.log(`[MockDB] Vital sign recorded: ${vital.id}`);
    return vital;
  },

  async getVitalSigns(queueId: string): Promise<VitalSign[]> {
    return Array.from(vitalSigns.values()).filter((v) => v.queueId === queueId);
  },

  // Consultation operations
  async createConsultation(
    data: Omit<Consultation, "id" | "consultedAt">
  ): Promise<Consultation> {
    const consultation: Consultation = {
      id: `consultation_${consultationCounter++}`,
      ...data,
      consultedAt: new Date(),
    };

    consultations.set(consultation.id, consultation);
    console.log(`[MockDB] Consultation created: ${consultation.id}`);
    return consultation;
  },

  async getConsultation(consultationId: string): Promise<Consultation | null> {
    return consultations.get(consultationId) || null;
  },

  async getPatientConsultation(patientId: string): Promise<Consultation | null> {
    const consultation = Array.from(consultations.values()).find(
      (c) => c.patientId === patientId
    );
    return consultation || null;
  },

  // Utility methods
  async clearAllData(): Promise<void> {
    patients.clear();
    queueEntries.clear();
    vitalSigns.clear();
    consultations.clear();
    patientCounter = 1;
    queueCounter = 1;
    vitalCounter = 1;
    consultationCounter = 1;
    console.log("[MockDB] All data cleared");
  },

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(patients.values());
  },

  async getAllQueueEntries(): Promise<QueueEntry[]> {
    return Array.from(queueEntries.values());
  },

  // Status check
  isAvailable(): boolean {
    return true;
  },
};
