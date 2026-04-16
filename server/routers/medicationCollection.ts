import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { medicationCollectionStation, prescriptions, patients, clinics } from "../../drizzle/schema";
import { eq, and, desc, lt, gte } from "drizzle-orm";

export const medicationCollectionRouter = router({
  // Initialize collection station entry when prescription is ready
  initializeCollection: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
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

        // Generate ticket number
        const ticketNumber = `T${Date.now().toString().slice(-6)}`;

        const result = await db.insert(medicationCollectionStation).values({
          prescriptionId: input.prescriptionId,
          patientId: input.patientId,
          clinicId: input.clinicId,
          status: "awaiting_arrival",
          ticketNumber,
          estimatedWaitTime: 10, // Default 10 minutes
        });

        return {
          success: true,
          ticketNumber,
          collectionId: (result as any)[0]?.insertId || 0,
        };
      } catch (error) {
        console.error("[Initialize Collection] Error:", error);
        throw error;
      }
    }),

  // Record patient arrival
  recordArrival: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        prescriptionId: z.number(),
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

        const now = new Date();
        await db
          .update(medicationCollectionStation)
          .set({
            status: "patient_arrived",
            updatedAt: now,
          })
          .where(eq(medicationCollectionStation.id, input.collectionId));

        return {
          success: true,
          message: "Patient arrival recorded",
        };
      } catch (error) {
        console.error("[Record Arrival] Error:", error);
        throw error;
      }
    }),

  // Verify patient identity
  verifyPatient: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        patientId: z.number(),
        saIdNumber: z.string(),
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

        // Verify patient exists with matching SA ID
        const patient = await db
          .select()
          .from(patients)
          .where(eq(patients.id, input.patientId))
          .limit(1);

        if (patient.length === 0 || patient[0].saIdNumber !== input.saIdNumber) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Patient ID verification failed",
          });
        }

        const now = new Date();
        await db
          .update(medicationCollectionStation)
          .set({
            status: "verified",
            patientIdVerified: true,
            verifiedAt: now,
            verifiedBy: ctx.user?.id || null,
            updatedAt: now,
          })
          .where(eq(medicationCollectionStation.id, input.collectionId));

        return {
          success: true,
          message: "Patient verified successfully",
        };
      } catch (error) {
        console.error("[Verify Patient] Error:", error);
        throw error;
      }
    }),

  // Start medication preparation
  startPreparation: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const now = new Date();
        await db
          .update(medicationCollectionStation)
          .set({
            status: "preparing",
            preparationStartedAt: now,
            updatedAt: now,
          })
          .where(eq(medicationCollectionStation.id, input.collectionId));

        return {
          success: true,
          message: "Medication preparation started",
        };
      } catch (error) {
        console.error("[Start Preparation] Error:", error);
        throw error;
      }
    }),

  // Mark medication as ready for collection
  markReadyForCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        pharmacistInstructions: z.string().optional(),
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

        const now = new Date();
        await db
          .update(medicationCollectionStation)
          .set({
            status: "ready_for_collection",
            readyForCollectionAt: now,
            pharmacistInstructions: input.pharmacistInstructions || null,
            updatedAt: now,
          })
          .where(eq(medicationCollectionStation.id, input.collectionId));

        return {
          success: true,
          message: "Medication marked as ready for collection",
        };
      } catch (error) {
        console.error("[Mark Ready] Error:", error);
        throw error;
      }
    }),

  // Record medication collection
  recordCollection: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const now = new Date();
        const collectionRecord = await db
          .select()
          .from(medicationCollectionStation)
          .where(eq(medicationCollectionStation.id, input.collectionId))
          .limit(1);

        if (collectionRecord.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Collection record not found",
          });
        }

        const record = collectionRecord[0];
        let actualWaitTime = 0;

        if (record.readyForCollectionAt) {
          actualWaitTime = Math.floor(
            (now.getTime() - record.readyForCollectionAt.getTime()) / 60000
          );
        }

        await db
          .update(medicationCollectionStation)
          .set({
            status: "collected",
            collectedAt: now,
            actualWaitTime,
            updatedAt: now,
          })
          .where(eq(medicationCollectionStation.id, input.collectionId));

        // Update prescription status to dispensed
        if (record.prescriptionId) {
          await db
            .update(prescriptions)
            .set({
              status: "dispensed",
              dispenseTime: now,
              updatedAt: now,
            })
            .where(eq(prescriptions.id, record.prescriptionId));
        }

        return {
          success: true,
          message: "Medication collection recorded",
          actualWaitTime,
        };
      } catch (error) {
        console.error("[Record Collection] Error:", error);
        throw error;
      }
    }),

  // Get collection status
  getCollectionStatus: publicProcedure
    .input(z.object({ collectionId: z.number() }))
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
          .from(medicationCollectionStation)
          .where(eq(medicationCollectionStation.id, input.collectionId))
          .limit(1);

        if (result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Collection record not found",
          });
        }

        return result[0];
      } catch (error) {
        console.error("[Get Collection Status] Error:", error);
        throw error;
      }
    }),

  // Get nearest clinics for collection redirect
  getNearestClinicsForRedirect: publicProcedure
    .input(
      z.object({
        clinicId: z.number(),
        limit: z.number().default(3),
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

        // Get current clinic coordinates
        const currentClinic = await db
          .select()
          .from(clinics)
          .where(eq(clinics.id, input.clinicId))
          .limit(1);

        if (currentClinic.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }

        const clinic = currentClinic[0];
        const lat = parseFloat(clinic.latitude?.toString() || "0");
        const lng = parseFloat(clinic.longitude?.toString() || "0");

        // Get all other clinics and calculate distance
        const allClinics = await db.select().from(clinics);

        const withDistance = allClinics
          .map((c) => {
            const cLat = parseFloat(c.latitude?.toString() || "0");
            const cLng = parseFloat(c.longitude?.toString() || "0");

            // Haversine formula for distance calculation
            const R = 6371; // Earth's radius in km
            const dLat = ((cLat - lat) * Math.PI) / 180;
            const dLng = ((cLng - lng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat * Math.PI) / 180) *
                Math.cos((cLat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

            return { ...c, distance };
          })
          .filter((c) => c.id !== input.clinicId)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, input.limit);

        return withDistance;
      } catch (error) {
        console.error("[Get Nearest Clinics] Error:", error);
        throw error;
      }
    }),

  // Redirect patient to nearest clinic
  redirectToNearestClinic: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        redirectClinicId: z.number(),
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

        const now = new Date();
        await db
          .update(medicationCollectionStation)
          .set({
            status: "cancelled",
            redirectedToClinicId: input.redirectClinicId,
            redirectReason: input.reason || "Redirected to nearest clinic",
            updatedAt: now,
          })
          .where(eq(medicationCollectionStation.id, input.collectionId));

        return {
          success: true,
          message: "Patient redirected to nearest clinic",
        };
      } catch (error) {
        console.error("[Redirect to Clinic] Error:", error);
        throw error;
      }
    }),

  // Get collection history for patient
  getCollectionHistory: publicProcedure
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

        const history = await db
          .select()
          .from(medicationCollectionStation)
          .where(eq(medicationCollectionStation.patientId, input.patientId))
          .orderBy(desc(medicationCollectionStation.createdAt))
          .limit(input.limit);

        return history;
      } catch (error) {
        console.error("[Get Collection History] Error:", error);
        throw error;
      }
    }),

  // Get current wait time statistics
  getWaitTimeStats: publicProcedure
    .input(z.object({ clinicId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Get completed collections in the last hour
        const recentCollections = await db
          .select()
          .from(medicationCollectionStation)
          .where(
            and(
              eq(medicationCollectionStation.clinicId, input.clinicId),
              eq(medicationCollectionStation.status, "collected"),
              gte(medicationCollectionStation.collectedAt, oneHourAgo)
            )
          );

        const avgWaitTime =
          recentCollections.length > 0
            ? Math.round(
                recentCollections.reduce((sum, c) => sum + (c.actualWaitTime || 0), 0) /
                  recentCollections.length
              )
            : 0;

        // Get current queue length
        const currentQueue = await db
          .select()
          .from(medicationCollectionStation)
          .where(
            and(
              eq(medicationCollectionStation.clinicId, input.clinicId),
              eq(medicationCollectionStation.status, "ready_for_collection")
            )
          );

        return {
          averageWaitTime: avgWaitTime,
          currentQueueLength: currentQueue.length,
          estimatedWaitForNewPatient: avgWaitTime + 5, // Add 5 minutes buffer
        };
      } catch (error) {
        console.error("[Get Wait Time Stats] Error:", error);
        throw error;
      }
    }),
});
