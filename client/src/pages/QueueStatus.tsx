import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Clock, Users, CheckCircle2, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function QueueStatus() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, setLocation] = useLocation();
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Queries
  const patientQuery = trpc.patient.getById.useQuery(
    { patientId: parseInt(patientId || "0") },
    { enabled: !!patientId }
  );

  const queueStatusQuery = trpc.queue.getPatientQueueStatus.useQuery(
    { patientId: parseInt(patientId || "0"), clinicId: 1 }, // TODO: Get clinicId from context
    { enabled: !!patientId, refetchInterval: 5000 } // Auto-refresh every 5 seconds
  );

  const handleRefresh = () => {
    queueStatusQuery.refetch();
  };

  if (patientQuery.isLoading || queueStatusQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading queue status...</p>
        </div>
      </div>
    );
  }

  const patient = patientQuery.data;
  const queueEntry = queueStatusQuery.data;

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

  if (!queueEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            onClick={() => setLocation(`/patient/${patientId}`)}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="pt-8 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Not in Queue</h2>
                <p className="text-gray-600 mt-2">You are not currently in any queue</p>
              </div>
              <Button
                onClick={() => setLocation(`/queue-checkin/${patientId}`)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Check In to Queue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <Users className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "routine":
        return "bg-blue-100 text-blue-800";
      case "urgent":
        return "bg-amber-100 text-amber-800";
      case "emergency":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={queueStatusQuery.isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${queueStatusQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Main Status Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl">Your Queue Status</CardTitle>
            <CardDescription>
              {patient.firstName} {patient.lastName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Queue Number */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Queue Number</p>
              <p className="text-6xl font-bold text-blue-600">{queueEntry.queueNumber}</p>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge className={`${getStatusColor(queueEntry.status)} text-base px-4 py-2 gap-2`}>
                {getStatusIcon(queueEntry.status)}
                {queueEntry.status === "waiting"
                  ? "Waiting"
                  : queueEntry.status === "in_progress"
                  ? "In Progress"
                  : "Completed"}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Department</p>
                <p className="font-semibold text-gray-900">{queueEntry.department}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Priority</p>
                <Badge className={`${getPriorityColor(queueEntry.priority)} text-xs`}>
                  {queueEntry.priority.charAt(0).toUpperCase() + queueEntry.priority.slice(1)}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Estimated Wait</p>
                <p className="font-semibold text-gray-900">{queueEntry.estimatedWaitTime} min</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Check-in Time</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {format(new Date(queueEntry.checkInTime), "HH:mm")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Check-in */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="w-1 h-12 bg-gray-200 mt-2"></div>
              </div>
              <div className="pt-2">
                <p className="font-semibold text-gray-900">Checked In</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(queueEntry.checkInTime), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            {/* Called */}
            {queueEntry.callTime ? (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="w-1 h-12 bg-gray-200 mt-2"></div>
                </div>
                <div className="pt-2">
                  <p className="font-semibold text-gray-900">Called to Department</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(queueEntry.callTime), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 opacity-50">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="w-1 h-12 bg-gray-200 mt-2"></div>
                </div>
                <div className="pt-2">
                  <p className="font-semibold text-gray-600">Waiting to be Called</p>
                  <p className="text-sm text-gray-500">Pending...</p>
                </div>
              </div>
            )}

            {/* Completed */}
            {queueEntry.completionTime ? (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="font-semibold text-gray-900">Completed</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(queueEntry.completionTime), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 opacity-50">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="font-semibold text-gray-600">Pending Completion</p>
                  <p className="text-sm text-gray-500">Waiting...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This page automatically updates every 5 seconds. You will also receive an SMS notification when your queue number is called.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setLocation(`/patient/${patientId}`)}
            variant="outline"
            className="flex-1"
          >
            View Profile
          </Button>
          <Button
            onClick={() => setLocation(`/queue-checkin/${patientId}`)}
            variant="outline"
            className="flex-1"
          >
            Check In Again
          </Button>
        </div>
      </div>
    </div>
  );
}
