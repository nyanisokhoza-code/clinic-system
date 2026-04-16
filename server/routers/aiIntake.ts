import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { aiIntakeAssessments, patients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const aiIntakeRouter = router({
  // Analyze symptoms and recommend department
  analyzeSymptoms: publicProcedure
    .input(
      z.object({
        patientId: z.number(),
        symptoms: z.string().min(10, "Please describe your symptoms in more detail"),
        duration: z.string().optional(),
        severity: z.enum(["mild", "moderate", "severe"]),
        medicalHistory: z.string().optional(),
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

        // Get patient data
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

        // Build AI prompt for symptom analysis
        const systemPrompt = `You are a medical triage assistant for a South African hospital. Your role is to:
1. Analyze patient symptoms
2. Recommend the most appropriate department
3. Assess urgency level (routine, urgent, emergency)
4. Provide brief guidance

Respond in JSON format with: { "recommendedDepartment": "...", "urgencyLevel": "routine|urgent|emergency", "reasoning": "...", "guidance": "..." }

Available departments: General Practice, Cardiology, Respiratory, Gastroenterology, Neurology, Orthopedics, Dermatology, Pediatrics, Obstetrics, Psychiatry, Emergency Medicine, Infectious Diseases`;

        const userPrompt = `Patient symptoms: ${input.symptoms}
Duration: ${input.duration || "Not specified"}
Severity: ${input.severity}
Medical history: ${input.medicalHistory || "None reported"}

Please analyze these symptoms and provide a recommendation.`;

        // Call LLM for analysis
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "symptom_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  recommendedDepartment: {
                    type: "string",
                    description: "Recommended hospital department",
                  },
                  urgencyLevel: {
                    type: "string",
                    enum: ["routine", "urgent", "emergency"],
                    description: "Urgency level for triage",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of the recommendation",
                  },
                  guidance: {
                    type: "string",
                    description: "Guidance for the patient",
                  },
                },
                required: ["recommendedDepartment", "urgencyLevel", "reasoning", "guidance"],
                additionalProperties: false,
              },
            },
          },
        });

        // Parse LLM response
        let analysis;
        try {
          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No content in LLM response");
          }
          const contentStr = typeof content === "string" ? content : JSON.stringify(content);
          analysis = JSON.parse(contentStr);
        } catch (error) {
          console.error("[AI Intake] Failed to parse LLM response:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to analyze symptoms",
          });
        }

        // Store assessment in database
        const assessmentResult = await db.insert(aiIntakeAssessments).values({
          patientId: input.patientId,
          clinicId: 1, // Default clinic, should be passed from context
          symptoms: {
            description: input.symptoms,
            duration: input.duration,
            severity: input.severity,
            medicalHistory: input.medicalHistory,
          },
          aiResponse: JSON.stringify(analysis),
          recommendedDepartment: analysis.recommendedDepartment,
          recommendedUrgency: analysis.urgencyLevel,
          confidence: "0.95" as any,
        });

        return {
          success: true,
          assessment: {
            id: (assessmentResult as any)[0]?.insertId || 0,
            recommendedDepartment: analysis.recommendedDepartment,
            urgencyLevel: analysis.urgencyLevel,
            reasoning: analysis.reasoning,
            guidance: analysis.guidance,
            timestamp: new Date(),
          },
        };
      } catch (error) {
        console.error("[Analyze Symptoms] Error:", error);
        throw error;
      }
    }),

  // Get symptom assessment history
  getAssessmentHistory: publicProcedure
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

        const assessments = await db
          .select()
          .from(aiIntakeAssessments)
          .where(eq(aiIntakeAssessments.patientId, input.patientId))
          .limit(input.limit);

        return assessments;
      } catch (error) {
        console.error("[Get Assessment History] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve assessment history",
        });
      }
    }),

  // Get symptom guidelines
  getSymptomGuidelines: publicProcedure.query(async () => {
    const guidelines = {
      emergency: {
        title: "Emergency Symptoms",
        symptoms: [
          "Chest pain or pressure",
          "Difficulty breathing",
          "Severe bleeding",
          "Loss of consciousness",
          "Severe allergic reaction",
          "Poisoning or overdose",
          "Severe burns",
          "Choking",
        ],
        action: "Go to Emergency Department immediately",
      },
      urgent: {
        title: "Urgent Symptoms",
        symptoms: [
          "High fever (>39°C)",
          "Severe headache",
          "Abdominal pain",
          "Persistent vomiting",
          "Difficulty swallowing",
          "Severe dizziness",
          "Suspected fracture",
          "Severe allergic reaction (mild)",
        ],
        action: "See a doctor within 2-4 hours",
      },
      routine: {
        title: "Routine Symptoms",
        symptoms: [
          "Mild cough",
          "Sore throat",
          "Mild headache",
          "Minor cuts or scrapes",
          "Skin rash",
          "Mild fever (<38.5°C)",
          "General check-up",
          "Prescription refill",
        ],
        action: "Schedule an appointment",
      },
    };

    return guidelines;
  }),

  // Get department information
  getDepartmentInfo: publicProcedure
    .input(z.object({ department: z.string() }))
    .query(async ({ input }) => {
      const departments: Record<string, any> = {
        "General Practice": {
          name: "General Practice",
          description: "Primary care for general health concerns",
          avgWaitTime: "30-45 minutes",
          icon: "🏥",
          conditions: [
            "Common cold",
            "Flu",
            "Mild infections",
            "Chronic disease management",
            "Preventive care",
          ],
        },
        Cardiology: {
          name: "Cardiology",
          description: "Heart and cardiovascular system care",
          avgWaitTime: "45-60 minutes",
          icon: "❤️",
          conditions: [
            "Chest pain",
            "Heart disease",
            "High blood pressure",
            "Arrhythmia",
            "Heart failure",
          ],
        },
        Respiratory: {
          name: "Respiratory Medicine",
          description: "Lung and respiratory system care",
          avgWaitTime: "40-55 minutes",
          icon: "💨",
          conditions: [
            "Asthma",
            "COPD",
            "Pneumonia",
            "Tuberculosis",
            "Chronic cough",
          ],
        },
        Gastroenterology: {
          name: "Gastroenterology",
          description: "Digestive system care",
          avgWaitTime: "50-65 minutes",
          icon: "🍽️",
          conditions: [
            "Acid reflux",
            "Ulcers",
            "Inflammatory bowel disease",
            "Liver disease",
            "Abdominal pain",
          ],
        },
        Neurology: {
          name: "Neurology",
          description: "Nervous system and brain care",
          avgWaitTime: "45-60 minutes",
          icon: "🧠",
          conditions: [
            "Headaches",
            "Migraines",
            "Seizures",
            "Stroke",
            "Neurological disorders",
          ],
        },
        Orthopedics: {
          name: "Orthopedics",
          description: "Bone and joint care",
          avgWaitTime: "40-55 minutes",
          icon: "🦴",
          conditions: [
            "Fractures",
            "Joint pain",
            "Arthritis",
            "Sports injuries",
            "Bone disorders",
          ],
        },
        Dermatology: {
          name: "Dermatology",
          description: "Skin care",
          avgWaitTime: "35-50 minutes",
          icon: "🩹",
          conditions: [
            "Skin rash",
            "Acne",
            "Eczema",
            "Psoriasis",
            "Skin infections",
          ],
        },
        Pediatrics: {
          name: "Pediatrics",
          description: "Children's health care",
          avgWaitTime: "30-45 minutes",
          icon: "👶",
          conditions: [
            "Childhood illnesses",
            "Vaccinations",
            "Growth monitoring",
            "Developmental concerns",
            "Pediatric emergencies",
          ],
        },
        "Emergency Medicine": {
          name: "Emergency Medicine",
          description: "Acute and emergency care",
          avgWaitTime: "Variable",
          icon: "🚨",
          conditions: [
            "Life-threatening conditions",
            "Severe injuries",
            "Acute illnesses",
            "Poisoning",
            "Severe allergic reactions",
          ],
        },
      };

      return departments[input.department] || null;
    }),

  // Quick symptom checker
  quickSymptomCheck: publicProcedure
    .input(z.object({ symptom: z.string() }))
    .query(async () => {
      // This would typically call an LLM for quick checks
      // For now, return a simple response
      return {
        symptom: "symptom",
        suggestedDepartments: ["General Practice"],
        urgencyLevel: "routine",
        message: "Please provide more details for a complete assessment",
      };
    }),

  // Get assessment details
  getAssessmentDetails: publicProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const assessment = await db
          .select()
          .from(aiIntakeAssessments)
          .where(eq(aiIntakeAssessments.id, input.assessmentId))
          .limit(1);

        if (assessment.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assessment not found",
          });
        }

        return assessment[0];
      } catch (error) {
        console.error("[Get Assessment Details] Error:", error);
        throw error;
      }
    }),
});
