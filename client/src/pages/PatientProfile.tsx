import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, Heart, Pill, Clock, ArrowLeft, Edit2, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function PatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);

  const patientQuery = trpc.patient.getById.useQuery(
    { patientId: parseInt(patientId || "0") },
    { enabled: !!patientId }
  );

  const medicalHistoryQuery = trpc.patient.getMedicalHistory.useQuery(
    { patientId: parseInt(patientId || "0"), limit: 50 },
    { enabled: !!patientId }
  );

  if (patientQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Patient not found or an error occurred while loading the profile.
              </AlertDescription>
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

  const patient = patientQuery.data;
  const medicalHistory = medicalHistoryQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        {/* Patient Header Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-blue-100 mt-1">
                  SA ID: {patient.saIdNumber}
                </p>
                <div className="flex gap-2 mt-3">
                  {patient.bloodType && (
                    <Badge variant="secondary" className="bg-blue-500 text-white">
                      {patient.bloodType}
                    </Badge>
                  )}
                  {patient.gender && (
                    <Badge variant="secondary" className="bg-blue-500 text-white">
                      {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-blue-100">
                <p className="text-sm">Registered</p>
                <p className="text-lg font-semibold">
                  {format(new Date(patient.registrationDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setLocation(`/queue-checkin/${patientId}`)}
            className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700"
          >
            📋 Check In to Queue
          </Button>
          <Button
            onClick={() => setLocation(`/queue-status/${patientId}`)}
            variant="outline"
            className="flex-1 min-w-[140px]"
          >
            ⏱️ Queue Status
          </Button>
          <Button
            onClick={() => setLocation(`/wayfinding/${patientId}`)}
            variant="outline"
            className="flex-1 min-w-[140px]"
          >
            🗺️ Wayfinding
          </Button>
          <Button
            onClick={() => setLocation(`/concierge/${patientId}`)}
            variant="outline"
            className="flex-1 min-w-[140px]"
          >
            💬 Concierge
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medical">Medical History</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Age</span>
                    <span className="font-semibold">
                      {patient.dateOfBirth
                        ? Math.floor(
                            (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) /
                              (365.25 * 24 * 60 * 60 * 1000)
                          )
                        : "N/A"}
                      {patient.dateOfBirth ? " years" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Visit</span>
                    <span className="font-semibold">
                      {patient.lastVisitDate
                        ? format(new Date(patient.lastVisitDate), "MMM d, yyyy")
                        : "No visits yet"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge variant={patient.isActive ? "default" : "secondary"}>
                      {patient.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{patient.phone}</p>
                    </div>
                  )}
                  {patient.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{patient.email}</p>
                    </div>
                  )}
                  {patient.address && (
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-sm">{patient.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Emergency Contact */}
            {(patient.emergencyContactName || patient.emergencyContactPhone) && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patient.emergencyContactName && (
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{patient.emergencyContactName}</p>
                    </div>
                  )}
                  {patient.emergencyContactPhone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{patient.emergencyContactPhone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="medical" className="space-y-4">
            {medicalHistory.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No medical history records found</p>
                </CardContent>
              </Card>
            ) : (
              medicalHistory.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{record.department}</CardTitle>
                        <CardDescription>
                          {format(new Date(record.visitDate), "MMMM d, yyyy 'at' h:mm a")}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{record.department}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {record.chiefComplaint && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Chief Complaint</p>
                        <p>{record.chiefComplaint}</p>
                      </div>
                    )}
                    {record.diagnosis && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Diagnosis</p>
                        <p>{record.diagnosis}</p>
                      </div>
                    )}
                    {record.treatmentPlan && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Treatment Plan</p>
                        <p>{record.treatmentPlan}</p>
                      </div>
                    )}
                    {record.notes && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Notes</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Allergies Tab */}
          <TabsContent value="allergies" className="space-y-4">
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="space-y-3">
                {patient.allergies.map((allergy: any, idx: number) => (
                  <Card key={idx} className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-900">{allergy.allergen}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`${
                                allergy.severity === "severe"
                                  ? "bg-red-100 text-red-800"
                                  : allergy.severity === "moderate"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {allergy.severity}
                            </Badge>
                          </div>
                          {allergy.reaction && (
                            <p className="text-sm text-red-700 mt-2">Reaction: {allergy.reaction}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No known allergies recorded</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-semibold">{patient.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email Address</p>
                  <p className="font-semibold">{patient.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Residential Address</p>
                  <p className="font-semibold">{patient.address || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>

            {(patient.emergencyContactName || patient.emergencyContactPhone) && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{patient.emergencyContactName || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{patient.emergencyContactPhone || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
