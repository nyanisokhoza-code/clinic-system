import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Clock, Users, MapPin, ArrowLeft, Loader2 } from "lucide-react";

const DEPARTMENTS = [
  { id: "general", name: "General Practice", icon: "🏥" },
  { id: "pediatrics", name: "Pediatrics", icon: "👶" },
  { id: "cardiology", name: "Cardiology", icon: "❤️" },
  { id: "orthopedics", name: "Orthopedics", icon: "🦴" },
  { id: "dermatology", name: "Dermatology", icon: "🩹" },
  { id: "mental_health", name: "Mental Health", icon: "🧠" },
];

export default function QueueCheckIn() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, setLocation] = useLocation();
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("routine");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInData, setCheckInData] = useState<any>(null);

  // Queries
  const clinicsQuery = trpc.clinic.getAll.useQuery();
  const patientQuery = trpc.patient.getById.useQuery(
    { patientId: parseInt(patientId || "0") },
    { enabled: !!patientId }
  );

  // Mutations
  const checkInMutation = trpc.queue.checkIn.useMutation({
    onSuccess: (data) => {
      setCheckInData(data);
      setIsCheckedIn(true);
      toast.success("Successfully checked in to queue!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to check in");
    },
  });

  const handleCheckIn = async () => {
    if (!selectedClinic || !selectedDepartment) {
      toast.error("Please select a clinic and department");
      return;
    }

    await checkInMutation.mutateAsync({
      patientId: parseInt(patientId || "0"),
      clinicId: parseInt(selectedClinic),
      department: selectedDepartment,
      priority: (selectedPriority as any) || "routine",
    });
  };

  if (patientQuery.isLoading || clinicsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const patient = patientQuery.data;
  const clinics = clinicsQuery.data || [];

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Patient not found</AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
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
        </div>

        {/* Success State */}
        {isCheckedIn ? (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">Check-in Successful!</h2>
                <p className="text-green-700">You have been added to the queue</p>
              </div>

              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Your Queue Number</p>
                  <p className="text-5xl font-bold text-blue-600">{checkInData?.queueNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Department</p>
                    <p className="font-semibold">{selectedDepartment}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Estimated Wait</p>
                    <p className="font-semibold">15 minutes</p>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You will receive an SMS notification when your queue number is called. Please stay nearby.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  onClick={() => setLocation(`/patient/${patientId}`)}
                  variant="outline"
                  className="flex-1"
                >
                  View Profile
                </Button>
                <Button
                  onClick={() => setLocation(`/queue-status/${patientId}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Track Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Check-in Form */
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Queue Check-in</CardTitle>
              <CardDescription className="text-blue-100">
                {patient.firstName} {patient.lastName}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Patient Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patient ID</p>
                    <p className="font-semibold">{patient.saIdNumber}</p>
                  </div>
                </div>
              </div>

              {/* Clinic Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Select Clinic</label>
                <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose a clinic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id.toString()}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {clinic.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Select Department</label>
                <div className="grid grid-cols-2 gap-3">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDepartment(dept.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedDepartment === dept.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-lg mb-1">{dept.icon}</p>
                      <p className="text-sm font-medium">{dept.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Priority Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "routine", label: "Routine", color: "bg-blue-50 border-blue-200" },
                    { value: "urgent", label: "Urgent", color: "bg-amber-50 border-amber-200" },
                    { value: "emergency", label: "Emergency", color: "bg-red-50 border-red-200" },
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => setSelectedPriority(priority.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedPriority === priority.value
                          ? `${priority.color} border-opacity-100`
                          : "border-gray-200"
                      }`}
                    >
                      <p className="text-sm font-medium">{priority.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Alert */}
              <Alert className="bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Average wait time is 15 minutes. You will be notified via SMS when your queue number is called.
                </AlertDescription>
              </Alert>

              {/* Check-in Button */}
              <Button
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending || !selectedClinic || !selectedDepartment}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-semibold"
              >
                {checkInMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  "Check In to Queue"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
