import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { notifications, patients, queues, clinics } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const smsOfflineRouter = router({
  // Send SMS notification
  sendSMS: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string(),
        notificationType: z.enum([
          "queue_called",
          "prescription_ready",
          "appointment_confirmed",
          "wayfinding_step",
          "collection_ready",
        ]),
        patientId: z.number().optional(),
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

        // Validate phone number format (South African)
        const phoneRegex = /^(\+27|0)[0-9]{9}$/;
        if (!phoneRegex.test(input.phoneNumber)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid South African phone number format",
          });
        }

        // Create notification record
        if (input.patientId) {
          await db.insert(notifications).values({
            patientId: input.patientId,
            type: "sms",
            channel: input.notificationType,
            title: `${input.notificationType.replace(/_/g, " ")}`,
            message: input.message,
            recipientPhone: input.phoneNumber,
            status: "pending",
          });
        }

        // In production, integrate with SMS gateway (Twilio, AWS SNS, etc.)
        // For now, we log the SMS
        console.log(`[SMS] To: ${input.phoneNumber}, Message: ${input.message}`);

        return {
          success: true,
          message: "SMS queued for delivery",
          phoneNumber: input.phoneNumber,
        };
      } catch (error) {
        console.error("[Send SMS] Error:", error);
        throw error;
      }
    }),

  // Get SMS templates
  getSMSTemplates: publicProcedure.query(async () => {
    const templates = {
      queue_called: {
        title: "Queue Number Called",
        template: "Your queue number {queueNumber} has been called. Please proceed to {department}.",
      },
      prescription_ready: {
        title: "Prescription Ready",
        template: "Your prescription is ready for collection at {clinic}. Please visit during operating hours.",
      },
      appointment_confirmed: {
        title: "Appointment Confirmed",
        template: "Your appointment is confirmed for {date} at {time} at {clinic}.",
      },
      wayfinding_step: {
        title: "Next Step",
        template: "Your next step: {step}. Location: {location}.",
      },
      collection_ready: {
        title: "Ready for Collection",
        template: "Your medication is ready at {clinic}. Queue number: {queueNumber}.",
      },
    };

    return templates;
  }),

  // Get patient contact preferences
  getContactPreferences: publicProcedure
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

        const patient = await db
          .select()
          .from(patients)
          .where(eq(patients.id, input.patientId))
          .limit(1);

        if (patient.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Patient not found",
          });
        }

        return {
          phone: patient[0].phone,
          email: patient[0].email,
          preferredContact: "sms", // Default to SMS for South African context
          smsEnabled: true,
          emailEnabled: !!patient[0].email,
        };
      } catch (error) {
        console.error("[Get Contact Preferences] Error:", error);
        throw error;
      }
    }),

  // Offline sync: Get pending offline actions
  getPendingOfflineActions: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        lastSyncTime: z.number().optional(),
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

        // Get pending notifications
        const pendingNotifications = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.patientId, input.patientId),
              eq(notifications.status, "pending")
            )
          );

        // Get current queue status
        const queueStatus = await db
          .select()
          .from(queues)
          .where(eq(queues.patientId, input.patientId))
          .limit(1);

        return {
          pendingNotifications,
          queueStatus: queueStatus[0] || null,
          syncTimestamp: Date.now(),
        };
      } catch (error) {
        console.error("[Get Pending Offline Actions] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve offline actions",
        });
      }
    }),

  // Offline sync: Submit offline actions
  submitOfflineActions: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        actions: z.array(
          z.object({
            type: z.enum(["queue_checkin", "consultation_note", "prescription_collection"]),
            data: z.record(z.string(), z.any()),
            timestamp: z.number(),
          })
        ),
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

        const results = [];

        for (const action of input.actions) {
          try {
            switch (action.type) {
              case "queue_checkin":
                // Process queue check-in
                results.push({
                  type: action.type,
                  status: "processed",
                  timestamp: action.timestamp,
                });
                break;

              case "consultation_note":
                // Process consultation note
                results.push({
                  type: action.type,
                  status: "processed",
                  timestamp: action.timestamp,
                });
                break;

              case "prescription_collection":
                // Process prescription collection
                results.push({
                  type: action.type,
                  status: "processed",
                  timestamp: action.timestamp,
                });
                break;

              default:
                results.push({
                  type: action.type,
                  status: "failed",
                  error: "Unknown action type",
                  timestamp: action.timestamp,
                });
            }
          } catch (err) {
            results.push({
              type: action.type,
              status: "failed",
              error: String(err),
              timestamp: action.timestamp,
            });
          }
        }

        return {
          success: true,
          processedCount: results.filter((r) => r.status === "processed").length,
          failedCount: results.filter((r) => r.status === "failed").length,
          results,
        };
      } catch (error) {
        console.error("[Submit Offline Actions] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process offline actions",
        });
      }
    }),

  // Get offline data bundle (for initial sync)
  getOfflineDataBundle: protectedProcedure
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

        // Get patient data
        const patientData = await db
          .select()
          .from(patients)
          .where(eq(patients.id, input.patientId))
          .limit(1);

        if (patientData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Patient not found",
          });
        }

        // Get all clinics (for offline reference)
        const clinicsData = await db.select().from(clinics);

        return {
          patient: patientData[0],
          clinics: clinicsData,
          bundleVersion: "1.0",
          bundleTimestamp: Date.now(),
        };
      } catch (error) {
        console.error("[Get Offline Data Bundle] Error:", error);
        throw error;
      }
    }),

  // Check connectivity status
  checkConnectivity: publicProcedure.query(async () => {
    return {
      connected: true,
      timestamp: Date.now(),
      message: "System is online",
    };
  }),

  // Get notification status
  getNotificationStatus: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const notification = await db
          .select()
          .from(notifications)
          .where(eq(notifications.id, input.notificationId))
          .limit(1);

        if (notification.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notification not found",
          });
        }

        return notification[0];
      } catch (error) {
        console.error("[Get Notification Status] Error:", error);
        throw error;
      }
    }),
});


