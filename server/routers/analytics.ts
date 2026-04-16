import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import {
  queues,
  consultations,
  prescriptions,
  notifications,
  users,
} from "../../drizzle/schema";
import { eq, gte, lte, and, count, sql } from "drizzle-orm";

export const analyticsRouter = router({
  // Get queue statistics
  getQueueStats: publicProcedure
    .input(
      z.object({
        clinicId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        const now = new Date();
        const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate || now;

        // Build where clause
        let whereCondition: any = and(
          gte(queues.checkInTime, startDate),
          lte(queues.checkInTime, endDate)
        );

        if (input.clinicId) {
          whereCondition = and(whereCondition, eq(queues.clinicId, input.clinicId));
        }

        // Get queue statistics
        const stats = await db
          .select({
            totalQueued: count(),
            routine: count(sql`CASE WHEN ${queues.priority} = 'routine' THEN 1 END`),
            urgent: count(sql`CASE WHEN ${queues.priority} = 'urgent' THEN 1 END`),
            emergency: count(sql`CASE WHEN ${queues.priority} = 'emergency' THEN 1 END`),
            completed: count(sql`CASE WHEN ${queues.status} = 'completed' THEN 1 END`),
            abandoned: count(sql`CASE WHEN ${queues.status} = 'abandoned' THEN 1 END`),
          })
          .from(queues)
          .where(whereCondition);

        const avgWaitTime = await db
          .select({
            avgMinutes: sql<number>`AVG(TIMESTAMPDIFF(MINUTE, ${queues.checkInTime}, ${queues.callTime}))`,
          })
          .from(queues)
          .where(and(whereCondition, sql`${queues.callTime} IS NOT NULL`));

        return {
          totalQueued: stats[0]?.totalQueued || 0,
          byPriority: {
            routine: stats[0]?.routine || 0,
            urgent: stats[0]?.urgent || 0,
            emergency: stats[0]?.emergency || 0,
          },
          completed: stats[0]?.completed || 0,
          abandoned: stats[0]?.abandoned || 0,
          completionRate: stats[0]?.totalQueued
            ? ((stats[0]?.completed || 0) / stats[0].totalQueued) * 100
            : 0,
          avgWaitTimeMinutes: avgWaitTime[0]?.avgMinutes || 0,
        };
      } catch (error) {
        console.error("[Get Queue Stats] Error:", error);
        throw error;
      }
    }),

  // Get consultation statistics
  getConsultationStats: publicProcedure
    .input(
      z.object({
        clinicId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        const now = new Date();
        const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate || now;

        let whereCondition: any = and(
          gte(consultations.consultationDate, startDate),
          lte(consultations.consultationDate, endDate)
        );

        if (input.clinicId) {
          whereCondition = and(whereCondition, eq(consultations.clinicId, input.clinicId));
        }

        const stats = await db
          .select({
            totalConsultations: count(),
            byDepartment: sql<string>`${consultations.department}`,
          })
          .from(consultations)
          .where(whereCondition);

        return {
          totalConsultations: stats.length,
          consultationsByDepartment: stats.reduce(
            (acc: any, curr: any) => {
              acc[curr.byDepartment] = (acc[curr.byDepartment] || 0) + 1;
              return acc;
            },
            {}
          ),
        };
      } catch (error) {
        console.error("[Get Consultation Stats] Error:", error);
        throw error;
      }
    }),

  // Get prescription statistics
  getPrescriptionStats: publicProcedure
    .input(
      z.object({
        clinicId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        const now = new Date();
        const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate || now;

        let whereCondition: any = and(
          gte(prescriptions.createdAt, startDate),
          lte(prescriptions.createdAt, endDate)
        );

        if (input.clinicId) {
          whereCondition = and(whereCondition, eq(prescriptions.clinicId, input.clinicId));
        }

        const stats = await db
          .select({
            totalPrescriptions: count(),
            pending: count(sql`CASE WHEN ${prescriptions.status} = 'pending' THEN 1 END`),
            ready: count(sql`CASE WHEN ${prescriptions.status} = 'ready' THEN 1 END`),
            dispensed: count(sql`CASE WHEN ${prescriptions.status} = 'dispensed' THEN 1 END`),
            cancelled: count(sql`CASE WHEN ${prescriptions.status} = 'cancelled' THEN 1 END`),
          })
          .from(prescriptions)
          .where(whereCondition);

        return {
          totalPrescriptions: stats[0]?.totalPrescriptions || 0,
          byStatus: {
            pending: stats[0]?.pending || 0,
            ready: stats[0]?.ready || 0,
            dispensed: stats[0]?.dispensed || 0,
            cancelled: stats[0]?.cancelled || 0,
          },
          dispensingRate: stats[0]?.totalPrescriptions
            ? ((stats[0]?.dispensed || 0) / stats[0].totalPrescriptions) * 100
            : 0,
        };
      } catch (error) {
        console.error("[Get Prescription Stats] Error:", error);
        throw error;
      }
    }),

  // Get staff productivity metrics
  getStaffProductivity: publicProcedure
    .input(
      z.object({
        clinicId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        const now = new Date();
        const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate || now;

        let whereCondition: any = and(
          gte(consultations.consultationDate, startDate),
          lte(consultations.consultationDate, endDate)
        );

        if (input.clinicId) {
          whereCondition = and(whereCondition, eq(consultations.clinicId, input.clinicId));
        }

        // Get consultations per doctor
        const doctorStats = await db
          .select({
            doctorId: consultations.doctorId,
            consultationCount: count(),
          })
          .from(consultations)
          .where(whereCondition)
          .groupBy(consultations.doctorId);

        // Enrich with doctor names
        const enrichedStats = await Promise.all(
          doctorStats.map(async (stat) => {
            const doctor = await db
              .select({ name: users.name })
              .from(users)
              .where(eq(users.id, stat.doctorId))
              .limit(1);

            return {
              doctorId: stat.doctorId,
              doctorName: doctor[0]?.name || "Unknown",
              consultationCount: stat.consultationCount,
            };
          })
        );

        return {
          staffMetrics: enrichedStats,
          totalConsultations: enrichedStats.reduce((sum, stat) => sum + stat.consultationCount, 0),
          avgConsultationsPerDoctor: enrichedStats.length
            ? enrichedStats.reduce((sum, stat) => sum + stat.consultationCount, 0) /
              enrichedStats.length
            : 0,
        };
      } catch (error) {
        console.error("[Get Staff Productivity] Error:", error);
        throw error;
      }
    }),

  // Get patient flow analytics
  getPatientFlow: publicProcedure
    .input(
      z.object({
        clinicId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        const now = new Date();
        const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate || now;

        let whereCondition: any = and(
          gte(queues.checkInTime, startDate),
          lte(queues.checkInTime, endDate)
        );

        if (input.clinicId) {
          whereCondition = and(whereCondition, eq(queues.clinicId, input.clinicId));
        }

        // Get daily patient flow
        const dailyFlow = await db
          .select({
            date: sql<string>`DATE(${queues.checkInTime})`,
            count: count(),
          })
          .from(queues)
          .where(whereCondition)
          .groupBy(sql`DATE(${queues.checkInTime})`)
          .orderBy(sql`DATE(${queues.checkInTime})`);

        return {
          dailyPatientFlow: dailyFlow.map((day: any) => ({
            date: day.date,
            patientCount: day.count,
          })),
          totalPatients: dailyFlow.reduce((sum: number, day: any) => sum + day.count, 0),
          avgPatientsPerDay: dailyFlow.length ? dailyFlow.reduce((sum: number, day: any) => sum + day.count, 0) / dailyFlow.length : 0,
        };
      } catch (error) {
        console.error("[Get Patient Flow] Error:", error);
        throw error;
      }
    }),

  // Get notification delivery statistics
  getNotificationStats: publicProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        const now = new Date();
        const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate || now;

        const whereCondition = and(
          gte(notifications.createdAt, startDate),
          lte(notifications.createdAt, endDate)
        );

        const stats = await db
          .select({
            totalNotifications: count(),
            bySms: count(sql`CASE WHEN ${notifications.channel} = 'sms' THEN 1 END`),
            byEmail: count(sql`CASE WHEN ${notifications.channel} = 'email' THEN 1 END`),
            byInApp: count(sql`CASE WHEN ${notifications.channel} = 'in_app' THEN 1 END`),
            sent: count(sql`CASE WHEN ${notifications.status} = 'sent' THEN 1 END`),
            failed: count(sql`CASE WHEN ${notifications.status} = 'failed' THEN 1 END`),
          })
          .from(notifications)
          .where(whereCondition);

        return {
          totalNotifications: stats[0]?.totalNotifications || 0,
          byChannel: {
            sms: stats[0]?.bySms || 0,
            email: stats[0]?.byEmail || 0,
            inApp: stats[0]?.byInApp || 0,
          },
          byStatus: {
            sent: stats[0]?.sent || 0,
            failed: stats[0]?.failed || 0,
          },
          deliveryRate: stats[0]?.totalNotifications
            ? ((stats[0]?.sent || 0) / stats[0].totalNotifications) * 100
            : 0,
        };
      } catch (error) {
        console.error("[Get Notification Stats] Error:", error);
        throw error;
      }
    }),

  // Get department performance
  getDepartmentPerformance: publicProcedure
    .input(
      z.object({
        clinicId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        const now = new Date();
        const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate || now;

        let whereCondition: any = and(
          gte(consultations.consultationDate, startDate),
          lte(consultations.consultationDate, endDate)
        );

        if (input.clinicId) {
          whereCondition = and(whereCondition, eq(consultations.clinicId, input.clinicId));
        }

        const deptStats = await db
          .select({
            department: consultations.department,
            consultationCount: count(),
          })
          .from(consultations)
          .where(whereCondition)
          .groupBy(consultations.department)
          .orderBy(sql`${count()} DESC`);

        return {
          departmentPerformance: deptStats.map((dept) => ({
            department: dept.department,
            consultations: dept.consultationCount,
          })),
        };
      } catch (error) {
        console.error("[Get Department Performance] Error:", error);
        throw error;
      }
    }),

  // Get health check summary
  getHealthCheckSummary: publicProcedure
    .input(
      z.object({
        clinicId: z.number().optional(),
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

        const now = new Date();
        const today = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        let queueWhere: any = gte(queues.checkInTime, today);
        let consultWhere: any = gte(consultations.consultationDate, today);
        let prescWhere: any = gte(prescriptions.createdAt, today);

        if (input.clinicId) {
          queueWhere = and(queueWhere, eq(queues.clinicId, input.clinicId));
          consultWhere = and(consultWhere, eq(consultations.clinicId, input.clinicId));
          prescWhere = and(prescWhere, eq(prescriptions.clinicId, input.clinicId));
        }

        const [queueCount, consultCount, prescCount] = await Promise.all([
          db.select({ count: count() }).from(queues).where(queueWhere),
          db.select({ count: count() }).from(consultations).where(consultWhere),
          db.select({ count: count() }).from(prescriptions).where(prescWhere),
        ]);

        return {
          todayMetrics: {
            patientsQueued: queueCount[0]?.count || 0,
            consultationsCompleted: consultCount[0]?.count || 0,
            prescriptionsCreated: prescCount[0]?.count || 0,
          },
          systemStatus: "healthy",
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error("[Get Health Check Summary] Error:", error);
        throw error;
      }
    }),
});
