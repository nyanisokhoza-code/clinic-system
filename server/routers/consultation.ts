import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { consultations, prescriptions, medicalHistory } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const consultationRouter = router({
  // Create a new consultation
  createConsultation: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        clinicId: z.number(),
        department: z.string(),
        chiefComplaint: z.string(),
        diagnosis: z.string().optional(),
        treatmentPlan: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Create consultation record
        const consultationResult = await db.insert(consultations).values({
          patientId: input.patientId,
          clinicId: input.clinicId,
          doctorId: ctx.user?.id || 0,
          department: input.department,
          chiefComplaint: input.chiefComplaint,
          diagnosis: input.diagnosis || null,
          treatmentPlan: input.treatmentPlan || null,
          notes: input.notes || null,
          consultationDate: new Date(),
        });

        const consultationId = (consultationResult as any)[0]?.insertId || 0;

        // Also add to medical history
        await db.insert(medicalHistory).values({
          patientId: input.patientId,
          department: input.department,
          chiefComplaint: input.chiefComplaint,
          diagnosis: input.diagnosis || null,
          treatmentPlan: input.treatmentPlan || null,
          notes: input.notes || null,
          visitDate: new Date(),
          doctorId: ctx.user?.id || 0,
        });

        return {
          success: true,
          message: "Consultation recorded successfully",
          consultationId,
        };
      } catch (error) {
        console.error("[Create Consultation] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create consultation",
        });
      }
    }),

  // Get consultation details
  getConsultation: publicProcedure
    .input(z.object({ consultationId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const result = await db
          .select()
          .from(consultations)
          .where(eq(consultations.id, input.consultationId))
          .limit(1);

        if (result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Consultation not found",
          });
        }

        return result[0];
      } catch (error) {
        console.error("[Get Consultation] Error:", error);
        throw error;
      }
    }),

  // Create prescription from consultation
  createPrescription: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        consultationId: z.number(),
        clinicId: z.number(),
        collectionClinicId: z.number().optional(),
        medications: z.array(
          z.object({
            name: z.string(),
            dosage: z.string(),
            frequency: z.string(),
            duration: z.string(),
            instructions: z.string().optional(),
          })
        ),
        notes: z.string().optional(),
        isRepeat: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const prescriptionResult = await db.insert(prescriptions).values({
          patientId: input.patientId,
          consultationId: input.consultationId,
          clinicId: input.clinicId,
          collectionClinicId: input.clinicId, // Default to same clinic for collection
          doctorId: ctx.user?.id || 0,
          medications: input.medications,
          notes: input.notes || null,
          isRepeat: input.isRepeat,
          status: "pending",
          prescriptionDate: new Date(),
        });

        const prescriptionId = (prescriptionResult as any)[0]?.insertId || 0;

        // TODO: Send notification to dispensary staff about new prescription
        // This would trigger a real-time notification to the dispensary dashboard

        return {
          success: true,
          message: "Prescription created and sent to dispensary",
          prescriptionId,
        };
      } catch (error) {
        console.error("[Create Prescription] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create prescription",
        });
      }
    }),

  // Get patient prescriptions
  getPatientPrescriptions: publicProcedure
    .input(
      z.object({
        patientId: z.number(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const result = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.patientId, input.patientId))
          .limit(input.limit);

        return result;
      } catch (error) {
        console.error("[Get Patient Prescriptions] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve prescriptions",
        });
      }
    }),

  // Update prescription status
  updatePrescriptionStatus: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        status: z.enum(["pending", "ready", "dispensed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        await db
          .update(prescriptions)
          .set({ status: input.status })
          .where(eq(prescriptions.id, input.prescriptionId));

        return {
          success: true,
          message: `Prescription status updated to ${input.status}`,
        };
      } catch (error) {
        console.error("[Update Prescription Status] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update prescription status",
        });
      }
    }),

  // Get pending consultations for clinic
  getPendingConsultations: protectedProcedure
    .input(
      z.object({
        clinicId: z.number(),
        department: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const result = await db
          .select()
          .from(consultations)
          .where(eq(consultations.clinicId, input.clinicId))
          .limit(50);

        return result;
      } catch (error) {
        console.error("[Get Pending Consultations] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve consultations",
        });
      }
    }),
});
