import { useState } from "react";
import { useParams } from "wouter";
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

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export default function TestDoctorConsultation() {
  const { patientId } = useParams<{ patientId: string }>();

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
    { patientId: parseInt(patientId || "1") },
    { enabled: !!patientId }
  );

  const medicalHistoryQuery = trpc.patient.getMedicalHistory.useQuery(
    { patientId: parseInt(patientId || "1"), limit: 5 },
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

  if (patientQuery.isLoading) {
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
    toast.success("Medication added");
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
    toast.success("Medication removed");
  };

  const handleSaveConsultation = async () => {
    if (!chiefComplaint || !diagnosis) {
      toast.error("Please fill in chief complaint and diagnosis");
      return;
    }

    createConsultationMutation.mutate({
      patientId: parseInt(patientId || "1"),
      department,
      chiefComplaint,
      diagnosis,
      treatmentPlan,
      notes,
      isRepeat,
    });
  };

  const handleCreatePrescription = async () => {
    if (!consultationId) {
      toast.error("Please save consultation first");
      return;
    }

    if (medications.length === 0) {
      toast.error("Please add at least one medication");
      return;
    }

    createPrescriptionMutation.mutate({
      consultationId,
      medications,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Doctor Consultation</h1>
            <p className="text-slate-600 mt-1">Patient: {patient?.name || "Loading..."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Tabs defaultValue="consultation" className="space-y-4">
          <TabsList>
            <TabsTrigger value="consultation">Consultation</TabsTrigger>
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
          </TabsList>

          {/* Consultation Tab */}
          <TabsContent value="consultation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Consultation Details</CardTitle>
                <CardDescription>Record the patient consultation information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md mt-1"
                    >
                      <option value="general">General</option>
                      <option value="cardiology">Cardiology</option>
                      <option value="neurology">Neurology</option>
                      <option value="pediatrics">Pediatrics</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Repeat Visit?</label>
                    <input
                      type="checkbox"
                      checked={isRepeat}
                      onChange={(e) => setIsRepeat(e.target.checked)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Chief Complaint *</label>
                  <Textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="What is the patient's main complaint?"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Diagnosis *</label>
                  <Textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Your diagnosis"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Treatment Plan</label>
                  <Textarea
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    placeholder="Treatment recommendations"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Additional Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes"
                    className="mt-1"
                  />
                </div>

                {consultationSaved && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Consultation saved successfully! Consultation ID: {consultationId}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSaveConsultation}
                  disabled={createConsultationMutation.isPending}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createConsultationMutation.isPending ? "Saving..." : "Save Consultation"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                {medicalHistory.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.map((record: any, index: number) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-md">
                        <p className="font-medium">{record.diagnosis}</p>
                        <p className="text-sm text-slate-600">{record.date}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No medical history available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescription Tab */}
          <TabsContent value="prescription" className="space-y-4">
            {!consultationSaved && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Please save the consultation first before adding medications
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Add Medications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Medication name"
                    value={newMedication.name}
                    onChange={(e) =>
                      setNewMedication({ ...newMedication, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Dosage (e.g., 500mg)"
                    value={newMedication.dosage}
                    onChange={(e) =>
                      setNewMedication({ ...newMedication, dosage: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Frequency (e.g., 2x daily)"
                    value={newMedication.frequency}
                    onChange={(e) =>
                      setNewMedication({ ...newMedication, frequency: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Duration (e.g., 7 days)"
                    value={newMedication.duration}
                    onChange={(e) =>
                      setNewMedication({ ...newMedication, duration: e.target.value })
                    }
                  />
                </div>

                <Textarea
                  placeholder="Instructions (optional)"
                  value={newMedication.instructions}
                  onChange={(e) =>
                    setNewMedication({ ...newMedication, instructions: e.target.value })
                  }
                />

                <Button
                  onClick={handleAddMedication}
                  disabled={!consultationSaved}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </CardContent>
            </Card>

            {/* Medications List */}
            {medications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prescribed Medications ({medications.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {medications.map((med, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 rounded-md flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-slate-600">
                          {med.dosage} • {med.frequency} • {med.duration}
                        </p>
                        {med.instructions && (
                          <p className="text-sm text-slate-500 mt-1">{med.instructions}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedication(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    onClick={handleCreatePrescription}
                    disabled={createPrescriptionMutation.isPending || medications.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {createPrescriptionMutation.isPending
                      ? "Sending to Dispensary..."
                      : "Send Prescription to Dispensary"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
