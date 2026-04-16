import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { vitalSignsChecklist, queues, patients } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const vitalsRouter = router({
  // Initialize vital signs checklist for a queue entry
  initializeChecklist: protectedProcedure
    .input(
      z.object({
        queueId: z.number(),
        patientId: z.number(),
        clinicId: z.number(),
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

        // Create checklist entries for all vital types
        const vitalTypes = [
          "blood_pressure",
          "temperature",
          "heart_rate",
          "respiratory_rate",
          "weight",
          "height",
          "oxygen_saturation",
          "hiv_aids_test",
        ];

        const checklistEntries = vitalTypes.map((vitalType) => ({
          queueId: input.queueId,
          patientId: input.patientId,
          clinicId: input.clinicId,
          vitalType: vitalType as any,
          status: "pending" as const,
        }));

        const result = await db.insert(vitalSignsChecklist).values(checklistEntries);

        return {
          success: true,
          message: "Vital signs checklist initialized",
          checklistId: (result as any)[0]?.insertId || 0,
        };
      } catch (error) {
        console.error("[Initialize Checklist] Error:", error);
        throw error;
      }
    }),

  // Get checklist for a specific queue
  getChecklistByQueue: publicProcedure
    .input(z.object({ queueId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const checklist = await db
          .select()
          .from(vitalSignsChecklist)
          .where(eq(vitalSignsChecklist.queueId, input.queueId));

        return checklist;
      } catch (error) {
        console.error("[Get Checklist] Error:", error);
        throw error;
      }
    }),

  // Update a single vital sign
  updateVitalSign: protectedProcedure
    .input(
      z.object({
        queueId: z.number(),
        patientId: z.number(),
        vitalType: z.enum([
          "blood_pressure",
          "temperature",
          "heart_rate",
          "respiratory_rate",
          "weight",
          "height",
          "oxygen_saturation",
          "hiv_aids_test",
        ]),
        value: z.string(),
        unit: z.string(),
        notes: z.string().optional(),
        assignedRoom: z.string().optional(),
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

        // Find the vital sign record
        const existingVital = await db
          .select()
          .from(vitalSignsChecklist)
          .where(
            and(
              eq(vitalSignsChecklist.queueId, input.queueId),
              eq(vitalSignsChecklist.vitalType, input.vitalType)
            )
          )
          .limit(1);

        if (existingVital.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vital sign record not found",
          });
        }

        // Update the vital sign
        const now = new Date();
        const result = await db
          .update(vitalSignsChecklist)
          .set({
            status: "completed",
            value: input.value,
            unit: input.unit,
            notes: input.notes || null,
            assignedRoom: input.assignedRoom || null,
            assignedNurseId: ctx.user?.id || null,
            startedAt: existingVital[0].startedAt || now,
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(vitalSignsChecklist.id, existingVital[0].id));

        return {
          success: true,
          vitalType: input.vitalType,
          value: input.value,
          unit: input.unit,
          completedAt: now,
        };
      } catch (error) {
        console.error("[Update Vital Sign] Error:", error);
        throw error;
      }
    }),

  // Get vital signs for a patient (latest visit)
  getPatientVitals: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const vitals = await db
          .select()
          .from(vitalSignsChecklist)
          .where(
            and(
              eq(vitalSignsChecklist.patientId, input.patientId),
              eq(vitalSignsChecklist.status, "completed")
            )
          )
          .orderBy(vitalSignsChecklist.completedAt);

        return vitals;
      } catch (error) {
        console.error("[Get Patient Vitals] Error:", error);
        throw error;
      }
    }),

  // Complete the entire checklist
  completeChecklist: protectedProcedure
    .input(
      z.object({
        queueId: z.number(),
        patientId: z.number(),
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

        // Verify all vitals are completed
        const checklist = await db
          .select()
          .from(vitalSignsChecklist)
          .where(eq(vitalSignsChecklist.queueId, input.queueId));

        const allCompleted = checklist.every((v) => v.status === "completed");
        if (!allCompleted) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not all vital signs have been completed",
          });
        }

        // Update queue status to reflect vitals completion
        const now = new Date();
        await db
          .update(queues)
          .set({
            status: "in_progress",
            updatedAt: now,
          })
          .where(eq(queues.id, input.queueId));

        return {
          success: true,
          message: "Vital signs checklist completed",
          completedAt: now,
        };
      } catch (error) {
        console.error("[Complete Checklist] Error:", error);
        throw error;
      }
    }),

  // Get checklist progress (for patient view)
  getChecklistProgress: publicProcedure
    .input(z.object({ queueId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const checklist = await db
          .select()
          .from(vitalSignsChecklist)
          .where(eq(vitalSignsChecklist.queueId, input.queueId));

        const completed = checklist.filter((v) => v.status === "completed").length;
        const total = checklist.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          total,
          completed,
          percentage,
          vitals: checklist.map((v) => ({
            id: v.id,
            type: v.vitalType,
            status: v.status,
            value: v.value,
            unit: v.unit,
            room: v.assignedRoom,
            completedAt: v.completedAt,
          })),
        };
      } catch (error) {
        console.error("[Get Checklist Progress] Error:", error);
        throw error;
      }
    }),

  // Cancel a vital sign (for correction)
  cancelVitalSign: protectedProcedure
    .input(
      z.object({
        vitalId: z.number(),
        reason: z.string().optional(),
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

        const result = await db
          .update(vitalSignsChecklist)
          .set({
            status: "cancelled",
            notes: input.reason || "Cancelled by staff",
            updatedAt: new Date(),
          })
          .where(eq(vitalSignsChecklist.id, input.vitalId));

        return {
          success: true,
          message: "Vital sign cancelled",
        };
      } catch (error) {
        console.error("[Cancel Vital Sign] Error:", error);
        throw error;
      }
    }),
});
