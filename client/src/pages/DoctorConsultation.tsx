import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export default function DoctorConsultation() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: false });
  
  // Check for test user (from test login)
  const testUser = localStorage.getItem("test-user");
  const isTestUser = !!testUser;

  // Form states
  const [department, setDepartment] = useState("general");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isRepeat, setIsRepeat] = useState(false);
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [consultationSaved, setConsultationSaved] = useState(false);
  const [newMedication, setNewMedication] = useState<Medication>({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  // Queries
  const patientQuery = trpc.patient.getById.useQuery(
    { patientId: parseInt(patientId || "0") },
    { enabled: !!patientId }
  );

  const medicalHistoryQuery = trpc.patient.getMedicalHistory.useQuery(
    { patientId: parseInt(patientId || "0"), limit: 5 },
    { enabled: !!patientId }
  );

  // Mutations
  const createConsultationMutation = trpc.consultation.createConsultation.useMutation({
    onSuccess: (data) => {
      toast.success("Consultation recorded successfully");
      setConsultationId(data.consultationId);
      setConsultationSaved(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record consultation");
    },
  });

  const createPrescriptionMutation = trpc.consultation.createPrescription.useMutation({
    onSuccess: (data) => {
      toast.success("Prescription sent to dispensary!");
      setMedications([]);
      toast.info(`Prescription ID: ${data.prescriptionId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create prescription");
    },
  });

  if (patientQuery.isLoading || (!user && !isTestUser)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading consultation interface...</p>
        </div>
      </div>
    );
  }

  const patient = patientQuery.data;
  const medicalHistory = medicalHistoryQuery.data || [];

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) {
      toast.error("Please fill in medication name, dosage, and frequency");
      return;
    }
    setMedications([...medications, newMedication]);
    setNewMedication({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSaveConsultation = async () => {
    if (!chiefComplaint) {
      toast.error("Please enter the chief complaint");
      return;
    }

    await createConsultationMutation.mutateAsync({
      patientId: parseInt(patientId || "0"),
      clinicId: 1, // TODO: Get from context
      department,
      chiefComplaint,
      diagnosis: diagnosis || undefined,
      treatmentPlan: treatmentPlan || undefined,
      notes: notes || undefined,
    });
  };

  const handleCreatePrescription = async () => {
    if (medications.length === 0) {
      toast.error("Please add at least one medication");
      return;
    }

    if (!consultationId) {
      toast.error("Please save the consultation first");
      return;
    }

    await createPrescriptionMutation.mutateAsync({
      patientId: parseInt(patientId || "0"),
      consultationId,
      clinicId: 1, // TODO: Get from context
      medications,
      notes: notes || undefined,
      isRepeat,
    });
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Doctor Consultation</h1>
          <div className="w-10"></div>
        </div>

        {/* Patient Info Card */}
        {patient && (
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-blue-100 mt-1">SA ID: {patient.saIdNumber}</p>
                  <div className="flex gap-2 mt-3">
                    {patient.bloodType && (
                      <Badge variant="secondary" className="bg-blue-500">
                        {patient.bloodType}
                      </Badge>
                    )}
                    {patient.allergies && patient.allergies.length > 0 && (
                      <Badge variant="secondary" className="bg-red-500">
                        ⚠️ Allergies
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Age</p>
                  <p className="text-lg font-semibold">
                    {patient.dateOfBirth
                      ? Math.floor(
                          (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) /
                            (365.25 * 24 * 60 * 60 * 1000)
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Consultation Saved Alert */}
        {consultationSaved && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Consultation saved successfully (ID: {consultationId}). You can now proceed to create a prescription.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="consultation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultation">Consultation</TabsTrigger>
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
          </TabsList>

          {/* Consultation Tab */}
          <TabsContent value="consultation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Consultation Notes</CardTitle>
                <CardDescription>Record patient consultation details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Department */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General Practice</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="mental_health">Mental Health</option>
                  </select>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Chief Complaint *
                  </label>
                  <Textarea
                    placeholder="What is the patient's main concern?"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Diagnosis
                  </label>
                  <Textarea
                    placeholder="Enter diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                {/* Treatment Plan */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Treatment Plan
                  </label>
                  <Textarea
                    placeholder="Describe the treatment plan"
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Additional Notes
                  </label>
                  <Textarea
                    placeholder="Any additional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-20"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveConsultation}
                  disabled={createConsultationMutation.isPending || consultationSaved}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {createConsultationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : consultationSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Consultation Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Consultation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="history" className="space-y-4">
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
                          {new Date(record.visitDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{record.department}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {record.chiefComplaint && (
                      <div>
                        <p className="text-sm text-gray-600">Chief Complaint</p>
                        <p className="font-medium">{record.chiefComplaint}</p>
                      </div>
                    )}
                    {record.diagnosis && (
                      <div>
                        <p className="text-sm text-gray-600">Diagnosis</p>
                        <p className="font-medium">{record.diagnosis}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Prescription Tab */}
          <TabsContent value="prescription" className="space-y-4">
            {!consultationId && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Please save the consultation first before creating a prescription.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Medications</CardTitle>
                <CardDescription>Add medications to send to dispensary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Medication Form */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900">Add New Medication</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Medication Name *
                      </label>
                      <Input
                        placeholder="e.g., Amoxicillin"
                        value={newMedication.name}
                        onChange={(e) =>
                          setNewMedication({ ...newMedication, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Dosage *
                      </label>
                      <Input
                        placeholder="e.g., 500mg"
                        value={newMedication.dosage}
                        onChange={(e) =>
                          setNewMedication({ ...newMedication, dosage: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Frequency *
                      </label>
                      <Input
                        placeholder="e.g., 3 times daily"
                        value={newMedication.frequency}
                        onChange={(e) =>
                          setNewMedication({ ...newMedication, frequency: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Duration
                      </label>
                      <Input
                        placeholder="e.g., 7 days"
                        value={newMedication.duration}
                        onChange={(e) =>
                          setNewMedication({ ...newMedication, duration: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Instructions
                    </label>
                    <Textarea
                      placeholder="e.g., Take with food, avoid dairy"
                      value={newMedication.instructions}
                      onChange={(e) =>
                        setNewMedication({ ...newMedication, instructions: e.target.value })
                      }
                      className="min-h-20"
                    />
                  </div>

                  <Button
                    onClick={handleAddMedication}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>

                {/* Medications List */}
                {medications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Medications to Dispense</h3>
                    {medications.map((med, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-600">
                            {med.dosage} - {med.frequency}
                          </p>
                          {med.duration && (
                            <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                          )}
                          {med.instructions && (
                            <p className="text-sm text-amber-700 mt-1">
                              Instructions: {med.instructions}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleRemoveMedication(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info Alert */}
                {!consultationId && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Please save the consultation first before creating a prescription.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Repeat Prescription Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRepeat"
                    checked={isRepeat}
                    onChange={(e) => setIsRepeat(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isRepeat" className="text-sm font-medium text-gray-700">
                    This is a repeat prescription
                  </label>
                </div>

                {/* Send Prescription Button */}
                <Button
                  onClick={handleCreatePrescription}
                  disabled={
                    createPrescriptionMutation.isPending ||
                    medications.length === 0 ||
                    !consultationId
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {createPrescriptionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Send to Dispensary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
