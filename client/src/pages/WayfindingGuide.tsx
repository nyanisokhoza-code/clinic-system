import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MapPin, Clock, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function WayfindingGuide() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, setLocation] = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Queries
  const allStepsQuery = trpc.wayfinding.getAllSteps.useQuery();
  const progressQuery = trpc.wayfinding.getProgress.useQuery(
    {
      totalSteps: allStepsQuery.data?.totalSteps || 0,
      completedSteps,
    },
    { enabled: !!allStepsQuery.data }
  );

  const currentStepQuery = trpc.wayfinding.getCurrentStep.useQuery(
    { stepIndex: currentStepIndex },
    { enabled: !!allStepsQuery.data }
  );

  if (allStepsQuery.isLoading || !allStepsQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading wayfinding guide...</p>
        </div>
      </div>
    );
  }

  const steps = allStepsQuery.data.steps;
  const currentStep = currentStepQuery.data?.current;
  const nextStep = currentStepQuery.data?.next;
  const progress = progressQuery.data;

  const handleCompleteStep = () => {
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps([...completedSteps, currentStepIndex]);
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setLocation(`/patient/${patientId}`)}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Your Hospital Journey</h1>
          <div className="w-10"></div>
        </div>

        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">Overall Progress</span>
              <span className="text-sm font-bold text-blue-600">
                {progress?.progressPercentage || 0}%
              </span>
            </div>
            <Progress value={progress?.progressPercentage || 0} className="h-2" />

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{completedSteps.length}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {steps.length - completedSteps.length}
                </p>
                <p className="text-xs text-gray-600">Remaining</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {progress?.remainingTimeFormatted || "N/A"}
                </p>
                <p className="text-xs text-gray-600">Est. Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Step */}
        {currentStep && (
          <Card className="border-2 border-blue-200 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Step {currentStepIndex + 1}: {currentStep.title}
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-1">
                    {currentStep.description}
                  </CardDescription>
                </div>
                <span className="text-4xl">{currentStep.icon}</span>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Location & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Location</p>
                    <p className="font-semibold text-gray-900">{currentStep.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Estimated Duration</p>
                    <p className="font-semibold text-gray-900">
                      {currentStep.estimatedDuration} minutes
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-gray-900">Instructions:</p>
                <ol className="space-y-2">
                  {currentStep.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 pt-0.5">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Next Step Preview */}
              {nextStep && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <p className="font-semibold mb-1">Next Step:</p>
                    <p className="text-sm">
                      {nextStep.icon} {nextStep.title} - {nextStep.description}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handlePreviousStep}
                  variant="outline"
                  disabled={currentStepIndex === 0}
                  className="flex-1"
                >
                  Previous Step
                </Button>
                <Button
                  onClick={handleCompleteStep}
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {currentStepIndex === steps.length - 1
                    ? "Complete Journey"
                    : "Next Step"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Journey Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Journey Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        completedSteps.includes(idx)
                          ? "bg-green-100 text-green-700"
                          : idx === currentStepIndex
                          ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {completedSteps.includes(idx) ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-1 h-12 ${
                          completedSteps.includes(idx)
                            ? "bg-green-200"
                            : "bg-gray-200"
                        }`}
                      ></div>
                    )}
                  </div>

                  {/* Step content */}
                  <div
                    className="flex-1 pt-1 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setCurrentStepIndex(idx)}
                  >
                    <button
                      className={`text-left w-full p-3 rounded-lg border-2 transition-all ${
                        idx === currentStepIndex
                          ? "border-blue-400 bg-blue-50"
                          : completedSteps.includes(idx)
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">
                            {step.icon} {step.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.location}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Est. {step.estimatedDuration} min
                          </p>
                        </div>
                        {completedSteps.includes(idx) && (
                          <Badge className="bg-green-100 text-green-800">
                            Done
                          </Badge>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips & Info */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Helpful Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900">
            <p>
              • Keep your queue number handy - you will need it at each step
            </p>
            <p>
              • If you get lost, ask any staff member for directions
            </p>
            <p>
              • You will receive SMS notifications when it's time to move to the next step
            </p>
            <p>
              • Estimated times are averages - actual times may vary
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
