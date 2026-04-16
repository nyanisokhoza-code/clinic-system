import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, Users, CheckCircle2, Clock, Volume2, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const DEPARTMENTS = [
  "general",
  "pediatrics",
  "cardiology",
  "orthopedics",
  "dermatology",
  "mental_health",
];

export default function StaffQueueDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDepartment, setSelectedDepartment] = useState("general");
  const [selectedClinic, setSelectedClinic] = useState("1");

  // Queries
  const clinicsQuery = trpc.clinic.getAll.useQuery();
  const queueQuery = trpc.queue.getClinicQueue.useQuery(
    { clinicId: parseInt(selectedClinic), department: selectedDepartment },
    { refetchInterval: 3000 } // Auto-refresh every 3 seconds
  );

  // Mutations
  const callNextMutation = trpc.queue.callNextPatient.useMutation({
    onSuccess: (data) => {
      toast.success(`Called queue number ${data.queueNumber}`);
      queueQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to call next patient");
    },
  });

  const completeMutation = trpc.queue.completeQueueEntry.useMutation({
    onSuccess: () => {
      toast.success("Queue entry completed");
      queueQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete queue entry");
    },
  });

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You must be logged in to access this page</AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full mt-4"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clinics = clinicsQuery.data || [];
  const queue = queueQuery.data || [];
  const nextPatient = queue.length > 0 ? queue[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
            <p className="text-gray-600 mt-1">
              Welcome, {user.name || "Staff Member"}
            </p>
          </div>
          <Button
            onClick={() => queueQuery.refetch()}
            variant="outline"
            size="sm"
            disabled={queueQuery.isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${queueQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">
              Select Clinic
            </label>
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id.toString()}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">
              Select Department
            </label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Next Patient Card */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 h-full">
              <CardHeader>
                <CardTitle className="text-lg">Now Serving</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {nextPatient ? (
                  <>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600">Queue Number</p>
                      <p className="text-7xl font-bold text-blue-600">{nextPatient.queueNumber}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Status</p>
                        <Badge
                          className={
                            nextPatient.status === "waiting"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }
                        >
                          {nextPatient.status === "waiting" ? "Waiting" : "In Progress"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Check-in Time</p>
                        <p className="font-semibold">
                          {new Date(nextPatient.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Priority</p>
                        <Badge
                          className={
                            nextPatient.priority === "emergency"
                              ? "bg-red-100 text-red-800"
                              : nextPatient.priority === "urgent"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {nextPatient.priority.charAt(0).toUpperCase() + nextPatient.priority.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-blue-200">
                      {nextPatient.status === "waiting" ? (
                        <Button
                          onClick={() =>
                            callNextMutation.mutateAsync({
                              clinicId: parseInt(selectedClinic),
                              department: selectedDepartment,
                            })
                          }
                          disabled={callNextMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                        >
                          {callNextMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Calling...
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4" />
                              Call Patient
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => completeMutation.mutateAsync({ queueId: nextPatient.id })}
                          disabled={completeMutation.isPending}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                        >
                          {completeMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Mark Complete
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No patients in queue</p>
                    <p className="text-sm text-gray-500 mt-1">Queue is empty</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Queue Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Queue Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{queue.length}</p>
                <p className="text-sm text-gray-600 mt-1">Patients Waiting</p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Routine</span>
                  <Badge variant="outline">
                    {queue.filter((q) => q.priority === "routine").length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Urgent</span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800">
                    {queue.filter((q) => q.priority === "urgent").length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Emergency</span>
                  <Badge variant="outline" className="bg-red-50 text-red-800">
                    {queue.filter((q) => q.priority === "emergency").length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Queue List</CardTitle>
            <CardDescription>
              {queue.length} patient{queue.length !== 1 ? "s" : ""} in queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No patients in queue</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queue.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                      idx === 0
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {entry.queueNumber}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {idx === 0 ? "Now Serving" : `Position ${idx}`}
                        </p>
                        <p className="text-xs text-gray-600">
                          Checked in {new Date(entry.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        entry.priority === "emergency"
                          ? "bg-red-100 text-red-800"
                          : entry.priority === "urgent"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }
                    >
                      {entry.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
