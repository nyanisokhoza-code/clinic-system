import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Brain,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Heart,
  Zap,
  BookOpen,
} from "lucide-react";

export default function AIIntakeAssistant() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"symptoms" | "results">("symptoms");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("moderate");
  const [medicalHistory, setMedicalHistory] = useState("");

  // Queries
  const guidelinesQuery = trpc.aiIntake.getSymptomGuidelines.useQuery();
  const historyQuery = trpc.aiIntake.getAssessmentHistory.useQuery(
    { patientId: user?.id || 0, limit: 5 },
    { enabled: !!user?.id }
  );

  // Mutations
  const analyzeMutation = trpc.aiIntake.analyzeSymptoms.useMutation();
  const [lastAssessment, setLastAssessment] = useState<any>(null);

  const guidelines = guidelinesQuery.data || {};

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms");
      return;
    }

    try {
      const result = await analyzeMutation.mutateAsync({
        patientId: user?.id || 0,
        symptoms,
        duration,
        severity,
        medicalHistory,
      });

      setLastAssessment(result.assessment);
      setStep("results");
      toast.success("Symptoms analyzed successfully");
    } catch (error) {
      toast.error("Failed to analyze symptoms");
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "urgent":
        return <Zap className="w-5 h-5 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-100 text-red-800 border-red-300";
      case "urgent":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-8 h-8 text-blue-600" />
                AI Intake Assistant
              </h1>
              <p className="text-gray-600 mt-1">
                Describe your symptoms and get AI-powered department recommendations
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {step === "symptoms" ? (
              <>
                {/* Symptom Input Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Describe Your Symptoms</CardTitle>
                    <CardDescription>
                      Provide detailed information about what you're experiencing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Symptoms */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        What symptoms are you experiencing? *
                      </label>
                      <textarea
                        placeholder="Describe your symptoms in detail (e.g., 'I have a persistent cough, fever, and difficulty breathing')"
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        {symptoms.length} characters
                      </p>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        How long have you had these symptoms?
                      </label>
                      <Input
                        placeholder="e.g., '3 days', '1 week', 'Since yesterday'"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Severity Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["mild", "moderate", "severe"] as const).map((level) => (
                          <Button
                            key={level}
                            onClick={() => setSeverity(level)}
                            variant={severity === level ? "default" : "outline"}
                            className="capitalize"
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Medical History */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Relevant Medical History (Optional)
                      </label>
                      <textarea
                        placeholder="Any existing conditions, allergies, or medications you're taking"
                        value={medicalHistory}
                        onChange={(e) => setMedicalHistory(e.target.value)}
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Analyze Button */}
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzeMutation.isPending || !symptoms.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Analyze Symptoms
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Guidelines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Symptom Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="emergency" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="emergency" className="text-xs">
                          Emergency
                        </TabsTrigger>
                        <TabsTrigger value="urgent" className="text-xs">
                          Urgent
                        </TabsTrigger>
                        <TabsTrigger value="routine" className="text-xs">
                          Routine
                        </TabsTrigger>
                      </TabsList>

                      {Object.entries(guidelines).map(([key, guideline]: [string, any]) => (
                        <TabsContent key={key} value={key} className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">
                              {guideline.title}
                            </h4>
                            <ul className="space-y-1">
                              {guideline.symptoms.map((symptom: string, idx: number) => (
                                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-blue-600">•</span>
                                  {symptom}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                              {guideline.action}
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Results */}
                {lastAssessment && (
                  <Card className="border-2 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        Assessment Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Recommended Department */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 font-semibold mb-1">
                          RECOMMENDED DEPARTMENT
                        </p>
                        <h3 className="text-2xl font-bold text-blue-900">
                          {lastAssessment.recommendedDepartment}
                        </h3>
                      </div>

                      {/* Urgency Level */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-semibold mb-1">
                            URGENCY LEVEL
                          </p>
                          <Badge
                            className={`${getUrgencyColor(
                              lastAssessment.urgencyLevel
                            )} border capitalize text-base py-2 px-4`}
                          >
                            {getUrgencyIcon(lastAssessment.urgencyLevel)}
                            <span className="ml-2">{lastAssessment.urgencyLevel}</span>
                          </Badge>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-2">
                          WHY THIS DEPARTMENT?
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {lastAssessment.reasoning}
                        </p>
                      </div>

                      {/* Guidance */}
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-600 font-semibold mb-2">
                          GUIDANCE
                        </p>
                        <p className="text-sm text-amber-900">
                          {lastAssessment.guidance}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => {
                            setStep("symptoms");
                            setSymptoms("");
                            setDuration("");
                            setSeverity("moderate");
                            setMedicalHistory("");
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          New Assessment
                        </Button>
                        <Button
                          onClick={() => setLocation("/")}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Proceed to Check-In
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Describe Symptoms</p>
                    <p className="text-gray-600 text-xs">
                      Tell us what you're experiencing
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">AI Analysis</p>
                    <p className="text-gray-600 text-xs">
                      Our AI analyzes your symptoms
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Get Recommendation</p>
                    <p className="text-gray-600 text-xs">
                      Receive department and urgency recommendation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Assessments */}
            {historyQuery.data && historyQuery.data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Assessments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {historyQuery.data.slice(0, 3).map((assessment: any) => (
                    <div
                      key={assessment.id}
                      className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">
                          {assessment.recommendedDepartment}
                        </p>
                        <Badge className="text-xs">
                          {assessment.recommendedUrgency}
                        </Badge>
                      </div>
                      <p className="text-gray-600">
                        {new Date(assessment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-xs">
                This AI assessment is for guidance only and does not replace professional medical advice. Always follow the recommendations of qualified healthcare professionals.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
