import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, Users, Clock, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedClinic, setSelectedClinic] = useState("1");
  const [selectedDepartment, setSelectedDepartment] = useState("general");

  // Queries
  const clinicsQuery = trpc.clinic.getAll.useQuery();
  const queueQuery = trpc.queue.getClinicQueue.useQuery(
    { clinicId: parseInt(selectedClinic), department: selectedDepartment },
    { refetchInterval: 3000 }
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{queue.length}</p>
                <p className="text-sm text-gray-600 mt-1">Patients in Queue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {queue.filter((q) => q.status === "waiting").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Waiting</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {queue.filter((q) => q.status === "in_progress").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {queue.filter((q) => q.priority === "urgent" || q.priority === "emergency").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Urgent/Emergency</p>
              </div>
            </CardContent>
          </Card>
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
                <SelectItem value="general">General Practice</SelectItem>
                <SelectItem value="pediatrics">Pediatrics</SelectItem>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="orthopedics">Orthopedics</SelectItem>
                <SelectItem value="dermatology">Dermatology</SelectItem>
                <SelectItem value="mental_health">Mental Health</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Queue</CardTitle>
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
                        className={`p-4 rounded-lg border-2 flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${
                          idx === 0
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                        onClick={() => setLocation(`/doctor-consultation/1`)} // TODO: Get patient ID
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
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
                        <div className="flex items-center gap-2">
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
                          <Badge
                            variant="outline"
                            className={
                              entry.status === "in_progress"
                                ? "bg-amber-50"
                                : "bg-gray-50"
                            }
                          >
                            {entry.status === "waiting" ? "Waiting" : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => setLocation("/staff/queue")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                📞 Queue Management
              </Button>
              <Button
                onClick={() => setLocation("/doctor-consultation/1")}
                variant="outline"
                className="w-full"
              >
                📋 New Consultation
              </Button>
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full"
              >
                🏠 Home
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            This dashboard updates automatically every 3 seconds. Click on any patient to start a consultation.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
