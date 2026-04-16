import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowLeft,
  Heart,
  Thermometer,
  Droplet,
  Wind,
  Weight,
  Eye,
  Activity,
} from "lucide-react";

const VITAL_TYPES = [
  { id: "blood_pressure", label: "Blood Pressure", icon: Heart, unit: "mmHg", placeholder: "120/80" },
  { id: "temperature", label: "Temperature", icon: Thermometer, unit: "°C", placeholder: "37.5" },
  { id: "heart_rate", label: "Heart Rate", icon: Activity, unit: "bpm", placeholder: "72" },
  { id: "respiratory_rate", label: "Respiratory Rate", icon: Wind, unit: "breaths/min", placeholder: "16" },
  { id: "weight", label: "Weight", icon: Weight, unit: "kg", placeholder: "70" },
  { id: "height", label: "Height", icon: Eye, unit: "cm", placeholder: "175" },
  { id: "oxygen_saturation", label: "Oxygen Saturation", icon: Droplet, unit: "%", placeholder: "98" },
  { id: "hiv_aids_test", label: "HIV/AIDS Test", icon: AlertCircle, unit: "Result", placeholder: "Negative/Positive/Pending" },
];

export default function VitalSignsChecklist() {
  const { patientId, queueId } = useParams<{ patientId: string; queueId: string }>();
  const [, setLocation] = useLocation();
  const [assignedRoom, setAssignedRoom] = useState("Room 101");
  const [vitalValues, setVitalValues] = useState<Record<string, { value: string; notes: string }>>({});
  const [completedVitals, setCompletedVitals] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const patientQuery = trpc.patient.getById.useQuery(
    { patientId: parseInt(patientId || "0") },
    { enabled: !!patientId }
  );

  const vitalChecklistQuery = trpc.vitals.getChecklistByQueue.useQuery(
    { queueId: parseInt(queueId || "0") },
    { enabled: !!queueId, refetchInterval: 3000 }
  );

  // Mutations
  const updateVitalMutation = trpc.vitals.updateVitalSign.useMutation({
    onSuccess: (data) => {
      setCompletedVitals((prev) => new Set([...prev, data.vitalType]));
      toast.success(`${data.vitalType.replace(/_/g, " ")} recorded`);
      vitalChecklistQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record vital");
    },
  });

  const completeChecklistMutation = trpc.vitals.completeChecklist.useMutation({
    onSuccess: () => {
      toast.success("Vital signs checklist completed!");
      setLocation(`/patient/${patientId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete checklist");
    },
  });

  if (patientQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading patient information...</p>
        </div>
      </div>
    );
  }

  const patient = patientQuery.data;
  const checklist = vitalChecklistQuery.data || [];
  const allVitalsCompleted = VITAL_TYPES.length === completedVitals.size;

  const handleVitalInput = (vitalId: string, value: string, notes: string = "") => {
    setVitalValues((prev) => ({
      ...prev,
      [vitalId]: { value, notes },
    }));
  };

  const handleRecordVital = async (vitalId: string) => {
    const vitalData = vitalValues[vitalId];
    if (!vitalData || !vitalData.value) {
      toast.error("Please enter a value for this vital");
      return;
    }

    await updateVitalMutation.mutateAsync({
      queueId: parseInt(queueId || "0"),
      patientId: parseInt(patientId || "0"),
      vitalType: vitalId as any,
      value: vitalData.value,
      unit: VITAL_TYPES.find((v) => v.id === vitalId)?.unit || "",
      notes: vitalData.notes,
      assignedRoom,
    });
  };

  const handleCompleteChecklist = async () => {
    if (!allVitalsCompleted) {
      toast.error("Please complete all vital signs before proceeding");
      return;
    }

    setIsSubmitting(true);
    await completeChecklistMutation.mutateAsync({
      queueId: parseInt(queueId || "0"),
      patientId: parseInt(patientId || "0"),
    });
    setIsSubmitting(false);
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
          <div className="text-right">
            <p className="text-sm text-gray-600">Assigned Room</p>
            <Input
              value={assignedRoom}
              onChange={(e) => setAssignedRoom(e.target.value)}
              className="w-32 text-center font-semibold"
              placeholder="Room 101"
            />
          </div>
        </div>

        {/* Patient Info Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {patient?.firstName} {patient?.lastName}
                </h1>
                <p className="text-blue-100 mt-1">
                  SA ID: {patient?.saIdNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Queue ID</p>
                <p className="text-lg font-semibold">{queueId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vital Signs Progress</CardTitle>
            <CardDescription>
              {completedVitals.size} of {VITAL_TYPES.length} vitals completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(completedVitals.size / VITAL_TYPES.length) * 100}%` }}
              ></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {VITAL_TYPES.map((vital) => (
                <Badge
                  key={vital.id}
                  variant={completedVitals.has(vital.id) ? "default" : "outline"}
                  className={completedVitals.has(vital.id) ? "bg-green-600" : ""}
                >
                  {completedVitals.has(vital.id) ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {vital.label}
                    </>
                  ) : (
                    vital.label
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VITAL_TYPES.map((vital) => {
            const Icon = vital.icon;
            const isCompleted = completedVitals.has(vital.id);
            const vitalData = vitalValues[vital.id];

            return (
              <Card
                key={vital.id}
                className={`transition-all ${
                  isCompleted ? "border-green-200 bg-green-50" : "border-gray-200"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-base">{vital.label}</CardTitle>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {isCompleted ? (
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Recorded Value</p>
                      <p className="text-lg font-semibold text-green-700">
                        {vitalData?.value} {vital.unit}
                      </p>
                      {vitalData?.notes && (
                        <p className="text-xs text-gray-600 mt-1">Notes: {vitalData.notes}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder={vital.placeholder}
                          value={vitalData?.value || ""}
                          onChange={(e) =>
                            handleVitalInput(vital.id, e.target.value, vitalData?.notes || "")
                          }
                          className="flex-1"
                        />
                        <span className="flex items-center text-gray-600 text-sm font-medium px-2">
                          {vital.unit}
                        </span>
                      </div>

                      <Input
                        type="text"
                        placeholder="Notes (optional)"
                        value={vitalData?.notes || ""}
                        onChange={(e) =>
                          handleVitalInput(vital.id, vitalData?.value || "", e.target.value)
                        }
                        className="text-sm"
                      />

                      <Button
                        onClick={() => handleRecordVital(vital.id)}
                        disabled={updateVitalMutation.isPending || !vitalData?.value}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        {updateVitalMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Recording...
                          </>
                        ) : (
                          "Record Vital"
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Alert for HIV/AIDS Test */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            HIV/AIDS test result must be recorded. Ensure patient confidentiality and follow clinic protocols.
          </AlertDescription>
        </Alert>

        {/* Complete Button */}
        <div className="flex gap-3">
          <Button
            onClick={() => setLocation(`/patient/${patientId}`)}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteChecklist}
            disabled={!allVitalsCompleted || completeChecklistMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {completeChecklistMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Vital Signs Checklist
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
