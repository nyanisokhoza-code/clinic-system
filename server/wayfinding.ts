/**
 * Smart Wayfinding & Digital Concierge System
 * Guides patients through their hospital journey with step-by-step instructions
 */

export interface JourneyStep {
  id: string;
  order: number;
  title: string;
  description: string;
  location: string;
  department: string;
  icon: string;
  estimatedDuration: number; // in minutes
  instructions: string[];
  nextSteps?: string[];
}

export interface PatientJourney {
  patientId: number;
  clinicId: number;
  currentStep: number;
  completedSteps: number[];
  startTime: Date;
  estimatedCompletionTime: Date;
  status: "in_progress" | "completed" | "paused";
}

// Standard hospital journey flow
export const STANDARD_JOURNEY_FLOW: JourneyStep[] = [
  {
    id: "reception",
    order: 1,
    title: "Reception & Check-in",
    description: "Complete your check-in at the reception desk",
    location: "Main Reception Area",
    department: "reception",
    icon: "🏥",
    estimatedDuration: 5,
    instructions: [
      "Proceed to the main reception desk",
      "Provide your South African ID number",
      "Confirm your appointment or reason for visit",
      "Receive your queue number and instructions",
    ],
    nextSteps: ["vitals"],
  },
  {
    id: "vitals",
    order: 2,
    title: "Vital Signs Check",
    description: "Get your blood pressure, temperature, and other vitals checked",
    location: "Vitals Station - Room 101",
    department: "vitals",
    icon: "🩺",
    estimatedDuration: 10,
    instructions: [
      "Proceed to Vitals Station in Room 101",
      "Check in with the nurse",
      "Have your blood pressure, temperature, and weight measured",
      "Wait for your queue number to be called",
    ],
    nextSteps: ["waiting_area"],
  },
  {
    id: "waiting_area",
    order: 3,
    title: "Waiting Area",
    description: "Wait for your consultation appointment",
    location: "Waiting Area B - Second Floor",
    department: "waiting",
    icon: "🪑",
    estimatedDuration: 15,
    instructions: [
      "Proceed to Waiting Area B on the second floor",
      "Check in with the receptionist",
      "Take a seat and wait for your queue number to be called",
      "Listen for announcements or SMS notifications",
    ],
    nextSteps: ["consultation"],
  },
  {
    id: "consultation",
    order: 4,
    title: "Doctor Consultation",
    description: "Meet with the doctor for your consultation",
    location: "Consultation Room - Third Floor",
    department: "consultation",
    icon: "👨‍⚕️",
    estimatedDuration: 20,
    instructions: [
      "When your queue number is called, proceed to the consultation room",
      "Check in with the receptionist",
      "Enter the consultation room when called",
      "Discuss your health concerns with the doctor",
    ],
    nextSteps: ["dispensary"],
  },
  {
    id: "dispensary",
    order: 5,
    title: "Medication Collection",
    description: "Collect your prescribed medication from the dispensary",
    location: "Dispensary - Ground Floor",
    department: "dispensary",
    icon: "💊",
    estimatedDuration: 10,
    instructions: [
      "Proceed to the Dispensary on the ground floor",
      "Present your prescription to the pharmacist",
      "Wait for your medication to be prepared",
      "Collect your medication and verify the details",
      "Follow the pharmacist's instructions for medication use",
    ],
    nextSteps: [],
  },
];

// Calculate total estimated time for journey
export function calculateTotalEstimatedTime(steps: JourneyStep[]): number {
  return steps.reduce((total, step) => total + step.estimatedDuration, 0);
}

// Get current step based on patient progress
export function getCurrentStep(
  steps: JourneyStep[],
  currentStepIndex: number
): JourneyStep | null {
  if (currentStepIndex < 0 || currentStepIndex >= steps.length) {
    return null;
  }
  return steps[currentStepIndex];
}

// Get next step
export function getNextStep(
  steps: JourneyStep[],
  currentStepIndex: number
): JourneyStep | null {
  if (currentStepIndex + 1 >= steps.length) {
    return null;
  }
  return steps[currentStepIndex + 1];
}

// Get progress percentage
export function getProgressPercentage(
  totalSteps: number,
  completedSteps: number
): number {
  if (totalSteps === 0) return 0;
  return Math.round((completedSteps / totalSteps) * 100);
}

// Get remaining time estimate
export function getRemainingTimeEstimate(
  steps: JourneyStep[],
  completedStepIndices: number[]
): number {
  const remainingSteps = steps.filter(
    (_, idx) => !completedStepIndices.includes(idx)
  );
  return remainingSteps.reduce((total, step) => total + step.estimatedDuration, 0);
}

// Format time in human-readable format
export function formatTimeEstimate(minutes: number): string {
  if (minutes < 1) return "Less than 1 minute";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hour${hours > 1 ? "s" : ""} ${mins} minute${mins > 1 ? "s" : ""}`;
}

// Get wayfinding instructions for a specific location
export function getWayfindingInstructions(
  currentLocation: string,
  targetLocation: string
): string[] {
  // This would be expanded with actual floor maps and directions
  const directions: Record<string, Record<string, string[]>> = {
    "Main Reception Area": {
      "Vitals Station - Room 101": [
        "Exit the reception area and turn right",
        "Walk straight down the main corridor",
        "Room 101 is on your left side",
      ],
      "Waiting Area B - Second Floor": [
        "Exit the reception area and head to the elevator",
        "Take the elevator to the second floor",
        "Exit and follow the signs to Waiting Area B",
      ],
    },
    "Vitals Station - Room 101": {
      "Waiting Area B - Second Floor": [
        "Exit Room 101 and return to the main corridor",
        "Head to the elevator",
        "Take the elevator to the second floor",
        "Exit and follow the signs to Waiting Area B",
      ],
    },
  };

  return (
    directions[currentLocation]?.[targetLocation] || [
      "Please ask a staff member for directions",
    ]
  );
}
