import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { prescriptions, patients, notifications } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const dispensaryRouter = router({
  // Get pending prescriptions for dispensary
  getPendingPrescriptions: protectedProcedure
    .input(
      z.object({
        clinicId: z.number(),
        limit: z.number().default(50),
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
          .where(
            and(
              eq(prescriptions.clinicId, input.clinicId),
              eq(prescriptions.status, "pending")
            )
          )
          .limit(input.limit);

        // Enrich with patient data
        const enriched = await Promise.all(
          result.map(async (rx) => {
            const patientData = await db
              .select()
              .from(patients)
              .where(eq(patients.id, rx.patientId))
              .limit(1);

            return {
              ...rx,
              patient: patientData[0] || null,
              medications: Array.isArray(rx.medications)
                ? rx.medications
                : typeof rx.medications === "string"
                ? JSON.parse(rx.medications)
                : [],
            };
          })
        );

        return enriched;
      } catch (error) {
        console.error("[Get Pending Prescriptions] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve pending prescriptions",
        });
      }
    }),

  // Get ready prescriptions (for pickup)
  getReadyPrescriptions: protectedProcedure
    .input(
      z.object({
        clinicId: z.number(),
        limit: z.number().default(50),
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
          .where(
            and(
              eq(prescriptions.clinicId, input.clinicId),
              eq(prescriptions.status, "ready")
            )
          )
          .limit(input.limit);

        const enriched = await Promise.all(
          result.map(async (rx) => {
            const patientData = await db
              .select()
              .from(patients)
              .where(eq(patients.id, rx.patientId))
              .limit(1);

            return {
              ...rx,
              patient: patientData[0] || null,
              medications: Array.isArray(rx.medications)
                ? rx.medications
                : typeof rx.medications === "string"
                ? JSON.parse(rx.medications)
                : [],
            };
          })
        );

        return enriched;
      } catch (error) {
        console.error("[Get Ready Prescriptions] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve ready prescriptions",
        });
      }
    }),

  // Mark prescription as ready for pickup
  markAsReady: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
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

        // Get prescription details
        const rx = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.id, input.prescriptionId))
          .limit(1);

        if (rx.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prescription not found",
          });
        }

        // Update prescription status
        await db
          .update(prescriptions)
          .set({ status: "ready" })
          .where(eq(prescriptions.id, input.prescriptionId));

        // Send notification to patient
        const patient = await db
          .select()
          .from(patients)
          .where(eq(patients.id, rx[0].patientId))
          .limit(1);

        if (patient.length > 0) {
          await db.insert(notifications).values({
            patientId: rx[0].patientId,
            type: "sms",
            channel: "prescription_ready",
            title: "Medication Ready",
            message: `Your prescription is ready for collection at the dispensary`,
            recipientPhone: patient[0].phone || null,
            status: "pending",
          });
        }

        return {
          success: true,
          message: "Prescription marked as ready. Patient notified.",
        };
      } catch (error) {
        console.error("[Mark As Ready] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark prescription as ready",
        });
      }
    }),

  // Dispense prescription (complete fulfillment)
  dispensePrescription: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        quantitiesDispensed: z.record(z.string(), z.number()).optional(),
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

        // Update prescription status
        await db
          .update(prescriptions)
          .set({
            status: "dispensed",
            dispenseTime: new Date(),
            dispensedBy: ctx.user?.id || 0,
          })
          .where(eq(prescriptions.id, input.prescriptionId));

        // Get prescription for notification
        const rx = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.id, input.prescriptionId))
          .limit(1);

        if (rx.length > 0) {
          // Send completion notification
          await db.insert(notifications).values({
            patientId: rx[0].patientId,
            type: "in_app",
            channel: "prescription_dispensed",
            title: "Medication Dispensed",
            message: "Your prescription has been dispensed successfully",
            status: "pending",
          });
        }

        return {
          success: true,
          message: "Prescription dispensed successfully",
        };
      } catch (error) {
        console.error("[Dispense Prescription] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to dispense prescription",
        });
      }
    }),

  // Get dispensary statistics
  getDispensaryStats: protectedProcedure
    .input(
      z.object({
        clinicId: z.number(),
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

        const pending = await db
          .select()
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.clinicId, input.clinicId),
              eq(prescriptions.status, "pending")
            )
          );

        const ready = await db
          .select()
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.clinicId, input.clinicId),
              eq(prescriptions.status, "ready")
            )
          );

        const dispensed = await db
          .select()
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.clinicId, input.clinicId),
              eq(prescriptions.status, "dispensed")
            )
          );

        return {
          pending: pending.length,
          ready: ready.length,
          dispensed: dispensed.length,
          total: pending.length + ready.length + dispensed.length,
        };
      } catch (error) {
        console.error("[Get Dispensary Stats] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve statistics",
        });
      }
    }),

  // Search prescriptions
  searchPrescriptions: protectedProcedure
    .input(
      z.object({
        clinicId: z.number(),
        query: z.string(),
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

        // Search by patient name or SA ID
        const result = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.clinicId, input.clinicId))
          .limit(50);

        // Filter in application (since we need to search in patient data)
        const enriched = await Promise.all(
          result.map(async (rx) => {
            const patientData = await db
              .select()
              .from(patients)
              .where(eq(patients.id, rx.patientId))
              .limit(1);

            return {
              ...rx,
              patient: patientData[0] || null,
              medications: Array.isArray(rx.medications)
                ? rx.medications
                : typeof rx.medications === "string"
                ? JSON.parse(rx.medications)
                : [],
            };
          })
        );

        const filtered = enriched.filter(
          (item) =>
            item.patient?.firstName.toLowerCase().includes(input.query.toLowerCase()) ||
            item.patient?.lastName.toLowerCase().includes(input.query.toLowerCase()) ||
            item.patient?.saIdNumber.includes(input.query)
        );

        return filtered;
      } catch (error) {
        console.error("[Search Prescriptions] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search prescriptions",
        });
      }
    }),
});
