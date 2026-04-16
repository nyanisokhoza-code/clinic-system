import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  STANDARD_JOURNEY_FLOW,
  calculateTotalEstimatedTime,
  getCurrentStep,
  getNextStep,
  getProgressPercentage,
  getRemainingTimeEstimate,
  formatTimeEstimate,
  getWayfindingInstructions,
} from "../wayfinding";
import { TRPCError } from "@trpc/server";

export const wayfindingRouter = router({
  // Get patient's current journey
  getJourney: publicProcedure
    .input(z.object({
      patientId: z.number(),
      clinicId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        // In a real implementation, this would fetch from database
        // For now, return the standard journey flow with metadata
        const totalSteps = STANDARD_JOURNEY_FLOW.length;
        const totalEstimatedTime = calculateTotalEstimatedTime(STANDARD_JOURNEY_FLOW);

        return {
          patientId: input.patientId,
          clinicId: input.clinicId,
          steps: STANDARD_JOURNEY_FLOW,
          totalSteps,
          totalEstimatedTime,
          currentStepIndex: 0,
          completedSteps: [],
          status: "not_started",
        };
      } catch (error) {
        console.error("[Wayfinding] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve journey",
        });
      }
    }),

  // Get current step details
  getCurrentStep: publicProcedure
    .input(z.object({
      stepIndex: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        const step = getCurrentStep(STANDARD_JOURNEY_FLOW, input.stepIndex);

        if (!step) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Step not found",
          });
        }

        const nextStep = getNextStep(STANDARD_JOURNEY_FLOW, input.stepIndex);

        return {
          current: step,
          next: nextStep,
          remainingTime: getRemainingTimeEstimate(
            STANDARD_JOURNEY_FLOW,
            Array.from({ length: input.stepIndex }, (_, i) => i)
          ),
        };
      } catch (error) {
        console.error("[Get Current Step] Error:", error);
        throw error;
      }
    }),

  // Get wayfinding directions
  getDirections: publicProcedure
    .input(z.object({
      fromLocation: z.string(),
      toLocation: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const directions = getWayfindingInstructions(
          input.fromLocation,
          input.toLocation
        );

        return {
          from: input.fromLocation,
          to: input.toLocation,
          directions,
          estimatedWalkingTime: 5, // minutes
        };
      } catch (error) {
        console.error("[Get Directions] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve directions",
        });
      }
    }),

  // Get journey progress
  getProgress: publicProcedure
    .input(z.object({
      totalSteps: z.number(),
      completedSteps: z.array(z.number()),
    }))
    .query(async ({ input }) => {
      try {
        const progressPercentage = getProgressPercentage(
          input.totalSteps,
          input.completedSteps.length
        );

        const remainingTime = getRemainingTimeEstimate(
          STANDARD_JOURNEY_FLOW,
          input.completedSteps
        );

        return {
          totalSteps: input.totalSteps,
          completedSteps: input.completedSteps.length,
          progressPercentage,
          remainingTime,
          remainingTimeFormatted: formatTimeEstimate(remainingTime),
        };
      } catch (error) {
        console.error("[Get Progress] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate progress",
        });
      }
    }),

  // Get all journey steps
  getAllSteps: publicProcedure.query(async () => {
    try {
      return {
        steps: STANDARD_JOURNEY_FLOW,
        totalSteps: STANDARD_JOURNEY_FLOW.length,
        totalEstimatedTime: calculateTotalEstimatedTime(STANDARD_JOURNEY_FLOW),
        totalEstimatedTimeFormatted: formatTimeEstimate(
          calculateTotalEstimatedTime(STANDARD_JOURNEY_FLOW)
        ),
      };
    } catch (error) {
      console.error("[Get All Steps] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve steps",
      });
    }
  }),

  // Get step by ID
  getStepById: publicProcedure
    .input(z.object({ stepId: z.string() }))
    .query(async ({ input }) => {
      try {
        const step = STANDARD_JOURNEY_FLOW.find((s) => s.id === input.stepId);

        if (!step) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Step not found",
          });
        }

        return step;
      } catch (error) {
        console.error("[Get Step by ID] Error:", error);
        throw error;
      }
    }),
});
