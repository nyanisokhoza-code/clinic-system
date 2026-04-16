import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { clinics, prescriptions, patients } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const clinicCollectionRouter = router({
  // Get all clinics with distance calculation
  getNearestClinics: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
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

        const allClinics = await db.select().from(clinics);

        // Calculate distance using Haversine formula
        const clinicsWithDistance = allClinics.map((clinic) => {
          const lat1 = input.latitude;
          const lon1 = input.longitude;
          const lat2 = parseFloat(clinic.latitude || "0");
          const lon2 = parseFloat(clinic.longitude || "0");

          const R = 6371; // Earth's radius in km
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return {
            ...clinic,
            distance: Math.round(distance * 10) / 10,
          };
        });

        // Sort by distance and limit
        const sorted = clinicsWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, input.limit);

        return sorted;
      } catch (error) {
        console.error("[Get Nearest Clinics] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve nearest clinics",
        });
      }
    }),

  // Get clinic details
  getClinicDetails: publicProcedure
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

        const result = await db
          .select()
          .from(clinics)
          .where(eq(clinics.id, input.clinicId))
          .limit(1);

        if (result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }

        return result[0];
      } catch (error) {
        console.error("[Get Clinic Details] Error:", error);
        throw error;
      }
    }),

  // Get available prescriptions at clinic for collection
  getAvailablePrescriptions: publicProcedure
    .input(
      z.object({
        clinicId: z.number(),
        patientId: z.number(),
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
              eq(prescriptions.patientId, input.patientId),
              eq(prescriptions.status, "ready")
            )
          );

        return result.map((rx) => ({
          ...rx,
          medications: Array.isArray(rx.medications)
            ? rx.medications
            : typeof rx.medications === "string"
            ? JSON.parse(rx.medications)
            : [],
        }));
      } catch (error) {
        console.error("[Get Available Prescriptions] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve available prescriptions",
        });
      }
    }),

  // Set collection clinic for prescription
  setCollectionClinic: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        collectionClinicId: z.number(),
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
          .set({ collectionClinicId: input.collectionClinicId })
          .where(eq(prescriptions.id, input.prescriptionId));

        return {
          success: true,
          message: "Collection clinic updated successfully",
        };
      } catch (error) {
        console.error("[Set Collection Clinic] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set collection clinic",
        });
      }
    }),

  // Record medication collection
  recordCollection: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        collectionClinicId: z.number(),
        collectedBy: z.string().optional(),
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

        // Update prescription with collection clinic and mark as collected
        await db
          .update(prescriptions)
          .set({
            collectionClinicId: input.collectionClinicId,
            status: "dispensed",
            dispenseTime: new Date(),
            dispensedBy: ctx.user?.id || 0,
          })
          .where(eq(prescriptions.id, input.prescriptionId));

        return {
          success: true,
          message: "Medication collection recorded successfully",
        };
      } catch (error) {
        console.error("[Record Collection] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record collection",
        });
      }
    }),

  // Get patient collection history
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

        const result = await db
          .select()
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.patientId, input.patientId),
              eq(prescriptions.status, "dispensed")
            )
          )
          .limit(input.limit);

        // Enrich with clinic data
        const enriched = await Promise.all(
          result.map(async (rx) => {
            const clinic = await db
              .select()
              .from(clinics)
              .where(eq(clinics.id, rx.collectionClinicId || 0))
              .limit(1);

            return {
              ...rx,
              clinic: clinic[0] || null,
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
        console.error("[Get Collection History] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve collection history",
        });
      }
    }),

  // Search clinics by name or location
  searchClinics: publicProcedure
    .input(
      z.object({
        query: z.string(),
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

        const allClinics = await db.select().from(clinics);

        // Filter by name, location, or address
        const filtered = allClinics
          .filter(
            (clinic) =>
              clinic.name.toLowerCase().includes(input.query.toLowerCase()) ||
              clinic.address?.toLowerCase().includes(input.query.toLowerCase())
          )
          .slice(0, input.limit);

        return filtered;
      } catch (error) {
        console.error("[Search Clinics] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search clinics",
        });
      }
    }),
});
