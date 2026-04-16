import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { logAuditEvent } from "./db";
import { wayfindingRouter } from "./routers/wayfinding";
import { consultationRouter } from "./routers/consultation";
import { dispensaryRouter } from "./routers/dispensary";
import { clinicCollectionRouter } from "./routers/clinicCollection";
import { smsOfflineRouter } from "./routers/smsOffline";
import { aiIntakeRouter } from "./routers/aiIntake";
import { analyticsRouter } from "./routers/analytics";
import { vitalsRouter } from "./routers/vitals";
import { medicationCollectionRouter } from "./routers/medicationCollection";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SAIdSchema = z.string().regex(/^\d{13}$/, "Invalid South African ID number");

const PatientRegistrationSchema = z.object({
  saIdNumber: SAIdSchema,
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.object({
    allergen: z.string(),
    severity: z.enum(["mild", "moderate", "severe"]),
    reaction: z.string().optional(),
  })).optional(),
  chronicConditions: z.array(z.object({
    condition: z.string(),
    diagnosisDate: z.date().optional(),
    status: z.enum(["active", "inactive", "resolved"]),
  })).optional(),
});

const UpdatePatientSchema = PatientRegistrationSchema.partial();

// ============================================================================
// PATIENT ROUTER
// ============================================================================

const patientRouter = router({
  // Register a new patient
  register: publicProcedure
    .input(PatientRegistrationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if patient already exists
        const existing = await db.getPatientBySAId(input.saIdNumber);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Patient with this South African ID already exists",
          });
        }

        // Create the patient
        await db.createPatient({
          saIdNumber: input.saIdNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          phone: input.phone,
          email: input.email,
          address: input.address,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          bloodType: input.bloodType,
          allergies: input.allergies ? JSON.stringify(input.allergies) : null,
          chronicConditions: input.chronicConditions ? JSON.stringify(input.chronicConditions) : null,
          isActive: true,
        });

        // Retrieve the newly created patient
        const newPatient = await db.getPatientBySAId(input.saIdNumber);
        if (!newPatient) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create patient",
          });
        }

        // Log audit event
        await logAuditEvent({
          userId: ctx.user?.id || 0,
          patientId: newPatient.id,
          action: "patient_registration",
          resource: "patient",
          resourceId: newPatient.id,
          details: JSON.stringify({ saIdNumber: input.saIdNumber }),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        return { success: true, patientId: newPatient.id };
      } catch (error) {
        console.error("[Patient Registration] Error:", error);
        throw error;
      }
    }),

  // Get patient by SA ID
  getBySAId: publicProcedure
    .input(z.object({ saIdNumber: SAIdSchema }))
    .query(async ({ input, ctx }) => {
      try {
        const patient = await db.getPatientBySAId(input.saIdNumber);
        
        if (patient) {
          // Log audit event for data access
          await logAuditEvent({
            userId: ctx.user?.id || 0,
            patientId: patient.id,
            action: "view_patient_profile",
            resource: "patient",
            resourceId: patient.id,
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.headers["user-agent"] as string,
          });

          // Parse JSON fields
          return {
            ...patient,
            allergies: patient.allergies ? JSON.parse(patient.allergies as string) : [],
            chronicConditions: patient.chronicConditions ? JSON.parse(patient.chronicConditions as string) : [],
            medications: patient.medications ? JSON.parse(patient.medications as string) : [],
          };
        }

        return null;
      } catch (error) {
        console.error("[Get Patient] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve patient",
        });
      }
    }),

  // Get patient by ID (public - allows patients to view their own profile)
  getById: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const patient = await db.getPatientById(input.patientId);
        
        if (!patient) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Patient not found",
          });
        }

        // Log audit event
        await logAuditEvent({
          userId: ctx.user?.id || 0,
          patientId: patient.id,
          action: "view_patient_profile",
          resource: "patient",
          resourceId: patient.id,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        return {
          ...patient,
          allergies: patient.allergies ? JSON.parse(patient.allergies as string) : [],
          chronicConditions: patient.chronicConditions ? JSON.parse(patient.chronicConditions as string) : [],
          medications: patient.medications ? JSON.parse(patient.medications as string) : [],
        };
      } catch (error) {
        console.error("[Get Patient] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve patient",
        });
      }
    }),

  // Update patient profile (protected)
  update: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      updates: UpdatePatientSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const patient = await db.getPatientById(input.patientId);
        
        if (!patient) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Patient not found",
          });
        }

        const updates: any = { ...input.updates };
        if (input.updates.allergies) {
          updates.allergies = JSON.stringify(input.updates.allergies);
        }
        if (input.updates.chronicConditions) {
          updates.chronicConditions = JSON.stringify(input.updates.chronicConditions);
        }

        await db.updatePatient(input.patientId, updates);

        // Log audit event
        await logAuditEvent({
          userId: ctx.user.id,
          patientId: input.patientId,
          action: "update_patient_profile",
          resource: "patient",
          resourceId: input.patientId,
          details: JSON.stringify(input.updates),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        return { success: true };
      } catch (error) {
        console.error("[Update Patient] Error:", error);
        throw error;
      }
    }),

  // Get patient medical history
  getMedicalHistory: protectedProcedure
    .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      try {
        const history = await db.getPatientMedicalHistory(input.patientId, input.limit);

        // Log audit event
        await logAuditEvent({
          userId: ctx.user.id,
          patientId: input.patientId,
          action: "view_medical_history",
          resource: "medical_history",
          resourceId: input.patientId,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        return history.map(record => ({
          ...record,
          symptoms: record.symptoms ? JSON.parse(record.symptoms as string) : [],
          vitals: record.vitals ? JSON.parse(record.vitals as string) : {},
        }));
      } catch (error) {
        console.error("[Get Medical History] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve medical history",
        });
      }
    }),

  // Search patients
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      try {
        const results = await db.searchPatients(input.query, input.limit);
        return results;
      } catch (error) {
        console.error("[Search Patients] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search patients",
        });
      }
    }),
});

// ============================================================================
// QUEUE ROUTER
// ============================================================================

const queueRouter = router({
  // Check in patient to queue
  checkIn: publicProcedure
    .input(z.object({
      patientId: z.number(),
      clinicId: z.number(),
      department: z.string().min(1),
      priority: z.enum(["routine", "urgent", "emergency"]).default("routine"),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if patient already in queue
        const existingQueue = await db.getPatientCurrentQueue(input.patientId, input.clinicId);
        if (existingQueue) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Patient is already in the queue for this clinic",
          });
        }

        // Get next queue number
        const queueNumber = await db.getNextQueueNumber(input.clinicId, input.department);

        // Create queue entry
        const result = await db.createQueueEntry({
          patientId: input.patientId,
          clinicId: input.clinicId,
          department: input.department,
          queueNumber,
          priority: input.priority,
          status: "waiting",
          estimatedWaitTime: 15, // Default 15 minutes
        });

        // Log audit event
        await logAuditEvent({
          userId: ctx.user?.id || 0,
          patientId: input.patientId,
          action: "queue_check_in",
          resource: "queue",
          details: JSON.stringify({ clinicId: input.clinicId, department: input.department, queueNumber }),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        // Create notification for patient
        const patient = await db.getPatientById(input.patientId);
        if (patient && patient.phone) {
          await db.createNotification({
            patientId: input.patientId,
            type: "sms",
            channel: "queue_check_in",
            title: "Queue Check-in Confirmed",
            message: `You have been added to the queue. Your queue number is ${queueNumber}. Estimated wait time: 15 minutes.`,
            recipientPhone: patient.phone,
            status: "pending",
          });
        }

        return { success: true, queueNumber };
      } catch (error) {
        console.error("[Queue Check-in] Error:", error);
        throw error;
      }
    }),

  // Get clinic queue
  getClinicQueue: publicProcedure
    .input(z.object({
      clinicId: z.number(),
      department: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const queue = await db.getClinicQueue(input.clinicId, input.department);

        // Log audit event
        await logAuditEvent({
          userId: ctx.user?.id || 0,
          action: "view_queue",
          resource: "queue",
          details: JSON.stringify({ clinicId: input.clinicId, department: input.department }),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        return queue;
      } catch (error) {
        console.error("[Get Queue] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve queue",
        });
      }
    }),

  // Get patient queue status
  getPatientQueueStatus: publicProcedure
    .input(z.object({
      patientId: z.number(),
      clinicId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const queueEntry = await db.getPatientCurrentQueue(input.patientId, input.clinicId);

        if (queueEntry) {
          // Log audit event
          await logAuditEvent({
            userId: ctx.user?.id || 0,
            patientId: input.patientId,
            action: "view_queue_status",
            resource: "queue",
            resourceId: queueEntry.id,
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.headers["user-agent"] as string,
          });
        }

        return queueEntry || null;
      } catch (error) {
        console.error("[Get Queue Status] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve queue status",
        });
      }
    }),

  // Call next patient in queue
  callNextPatient: protectedProcedure
    .input(z.object({
      clinicId: z.number(),
      department: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const queue = await db.getClinicQueue(input.clinicId, input.department);
        
        if (queue.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No patients in queue",
          });
        }

        const nextPatient = queue[0];
        
        // Update queue status
        await db.updateQueueEntry(nextPatient.id, {
          status: "in_progress",
          callTime: new Date(),
        });

        // Create notification for patient
        const patient = await db.getPatientById(nextPatient.patientId);
        if (patient && patient.phone) {
          await db.createNotification({
            patientId: nextPatient.patientId,
            type: "sms",
            channel: "queue_called",
            title: "Your Turn",
            message: `Your queue number ${nextPatient.queueNumber} has been called. Please proceed to the ${input.department} department.`,
            recipientPhone: patient.phone,
            status: "pending",
          });
        }

        // Log audit event
        await logAuditEvent({
          userId: ctx.user.id,
          patientId: nextPatient.patientId,
          action: "queue_call",
          resource: "queue",
          resourceId: nextPatient.id,
          details: JSON.stringify({ queueNumber: nextPatient.queueNumber }),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        return { success: true, queueId: nextPatient.id, queueNumber: nextPatient.queueNumber };
      } catch (error) {
        console.error("[Call Next Patient] Error:", error);
        throw error;
      }
    }),

  // Complete queue entry
  completeQueueEntry: protectedProcedure
    .input(z.object({
      queueId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const queueEntry = await db.getQueueById(input.queueId);
        
        if (!queueEntry) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Queue entry not found",
          });
        }

        // Update queue status
        await db.updateQueueEntry(input.queueId, {
          status: "completed",
          completionTime: new Date(),
        });

        // Update patient last visit date
        await db.updatePatient(queueEntry.patientId, {
          lastVisitDate: new Date(),
        });

        // Log audit event
        await logAuditEvent({
          userId: ctx.user.id,
          patientId: queueEntry.patientId,
          action: "queue_complete",
          resource: "queue",
          resourceId: input.queueId,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        return { success: true };
      } catch (error) {
        console.error("[Complete Queue] Error:", error);
        throw error;
      }
    }),
});

// ============================================================================
// CLINIC ROUTER
// ============================================================================

const clinicRouter = router({
  // Get all clinics
  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      const clinics = await db.getAllClinics();

      // Log audit event
      await logAuditEvent({
        userId: ctx.user?.id || 0,
        action: "view_clinics",
        resource: "clinic",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"] as string,
      });

      return clinics;
    } catch (error) {
      console.error("[Get Clinics] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve clinics",
      });
    }
  }),

  // Get clinic by ID
  getById: publicProcedure
    .input(z.object({ clinicId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const clinic = await db.getClinicById(input.clinicId);

        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }

        // Log audit event
        await logAuditEvent({
          userId: ctx.user?.id || 0,
          action: "view_clinic",
          resource: "clinic",
          resourceId: input.clinicId,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"] as string,
        });

        return clinic;
      } catch (error) {
        console.error("[Get Clinic] Error:", error);
        throw error;
      }
    }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  patient: patientRouter,
  queue: queueRouter,
  clinic: clinicRouter,
  wayfinding: wayfindingRouter,
  consultation: consultationRouter,
  dispensary: dispensaryRouter,
  clinicCollection: clinicCollectionRouter,
  smsOffline: smsOfflineRouter,
  aiIntake: aiIntakeRouter,
  analytics: analyticsRouter,
  vitals: vitalsRouter,
  medicationCollection: medicationCollectionRouter,
});

export type AppRouter = typeof appRouter;
