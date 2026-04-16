import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowLeft,
  Search,
  MapPin,
  Phone,
  FileText,
} from "lucide-react";

type CollectionStage = "lookup" | "arrived" | "verified" | "preparing" | "ready" | "collected";

export default function MedicationCollectionStation() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<CollectionStage>("lookup");
  const [searchInput, setSearchInput] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [patientIdVerified, setPatientIdVerified] = useState("");
  const [currentPrescription, setCurrentPrescription] = useState<any>(null);
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [waitTime, setWaitTime] = useState(0);
  const [showNearestClinicOption, setShowNearestClinicOption] = useState(false);

  // Queries
  const searchPrescriptionsQuery = trpc.dispensary.searchPrescriptions.useQuery(
    { query: searchInput },
    { enabled: searchInput.length > 0 }
  );

  const prescriptionQuery = trpc.dispensary.getPendingPrescriptions.useQuery(
    { limit: 50 },
    { refetchInterval: 5000 }
  );

  // Mutations
  const markAsReadyMutation = trpc.dispensary.markAsReady.useMutation({
    onSuccess: () => {
      toast.success("Medication marked as ready for collection");
      setStage("ready");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark as ready");
    },
  });

  const dispenseMutation = trpc.dispensary.dispensePrescription.useMutation({
    onSuccess: () => {
      toast.success("Medication dispensed successfully");
      setStage("collected");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to dispense medication");
    },
  });

  const handleSearchPatient = async () => {
    if (!searchInput) {
      toast.error("Please enter patient ID or ticket number");
      return;
    }

    const results = searchPrescriptionsQuery.data || [];
    if (results.length === 0) {
      toast.error("No prescriptions found for this patient");
      return;
    }

    const prescription = results[0];
    setCurrentPrescription(prescription);
    setTicketNumber(prescription.id.toString());
    setStage("arrived");
  };

  const handleVerifyPatient = () => {
    if (!patientIdVerified) {
      toast.error("Please enter patient ID number");
      return;
    }

    if (currentPrescription && currentPrescription.patientId.toString() === patientIdVerified) {
      setStage("verified");
      toast.success("Patient verified successfully");
    } else {
      toast.error("Patient ID does not match prescription");
    }
  };

  const handleStartPreparation = () => {
    setStage("preparing");
    // Simulate preparation time
    setWaitTime(0);
    const interval = setInterval(() => {
      setWaitTime((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          setStage("ready");
          toast.success("Medication is ready for collection!");
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleCollectMedication = async () => {
    if (!currentPrescription) {
      toast.error("No prescription selected");
      return;
    }

    await dispenseMutation.mutateAsync({
      prescriptionId: currentPrescription.id,
    });
  };

  const handleRedirectToNearestClinic = () => {
    toast.info("Redirecting patient to nearest clinic...");
    setShowNearestClinicOption(false);
    // TODO: Implement nearest clinic lookup and redirection
  };

  const handleReset = () => {
    setStage("lookup");
    setSearchInput("");
    setTicketNumber("");
    setPatientIdVerified("");
    setCurrentPrescription(null);
    setCurrentPatient(null);
    setWaitTime(0);
    setShowNearestClinicOption(false);
  };

  // Lookup Stage
  if (stage === "lookup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Medication Collection Station</h1>
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Search Card */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle>Patient Lookup</CardTitle>
              <CardDescription className="text-blue-100">
                Search for patient by ID or ticket number
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">
                  Enter Patient ID or Ticket Number
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 1234567890123 or Ticket #001"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchPatient();
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearchPatient}
                    disabled={searchPrescriptionsQuery.isFetching || !searchInput}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {searchPrescriptionsQuery.isFetching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Info Alert */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Enter the patient's South African ID number or their ticket number to begin the collection process.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Pending Prescriptions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Prescriptions</CardTitle>
              <CardDescription>
                {prescriptionQuery.data?.length || 0} prescriptions awaiting collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prescriptionQuery.data && prescriptionQuery.data.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {prescriptionQuery.data.slice(0, 10).map((prescription: any) => (
                    <div
                      key={prescription.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSearchInput(prescription.patientId.toString());
                        setCurrentPrescription(prescription);
                        setTicketNumber(prescription.id.toString());
                        setStage("arrived");
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Ticket #{prescription.id}</p>
                          <p className="text-sm text-gray-600">Patient ID: {prescription.patientId}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {prescription.medications?.length || 0} medication(s)
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-800">
                          {prescription.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No pending prescriptions</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Arrived Stage
  if (stage === "arrived") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Patient Verification</h1>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Ticket Info */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ticket Number</p>
                  <p className="text-4xl font-bold text-green-600">{ticketNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Form */}
          <Card>
            <CardHeader>
              <CardTitle>Verify Patient Identity</CardTitle>
              <CardDescription>Please confirm patient ID to proceed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Patient ID Number *
                </label>
                <Input
                  placeholder="Enter 13-digit South African ID"
                  value={patientIdVerified}
                  onChange={(e) => setPatientIdVerified(e.target.value)}
                  className="text-lg"
                />
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Please ask the patient to provide their South African ID number for verification.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifyPatient}
                  disabled={!patientIdVerified}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Verified Stage - Show Prescription Details
  if (stage === "verified" && currentPrescription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Prescription Details</h1>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Verification Status */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Patient Verified</p>
                  <p className="text-sm text-green-700">Ready to proceed with medication preparation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Info */}
          <Card>
            <CardHeader>
              <CardTitle>Medications to Dispense</CardTitle>
              <CardDescription>
                Ticket #{ticketNumber} - {currentPrescription.medications?.length || 0} medication(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPrescription.medications && currentPrescription.medications.length > 0 ? (
                <div className="space-y-3">
                  {currentPrescription.medications.map((med: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <p className="font-semibold text-gray-900">{med.name}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                        <div>Dosage: {med.dosage}</div>
                        <div>Frequency: {med.frequency}</div>
                        <div>Duration: {med.duration}</div>
                        {med.instructions && (
                          <div className="col-span-2 text-amber-700">
                            Instructions: {med.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No medications in this prescription</p>
              )}

              {/* Pharmacist Instructions */}
              {currentPrescription.notes && (
                <Alert className="bg-blue-50 border-blue-200">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Pharmacist Notes:</strong> {currentPrescription.notes}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartPreparation}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Start Preparation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Preparing Stage
  if (stage === "preparing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Preparing Medication</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">Ticket #{ticketNumber}</p>
            </div>
          </div>

          {/* Progress Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-lg font-semibold text-blue-900">Preparing Medication</p>
                <p className="text-sm text-blue-700 mt-1">Please wait...</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Preparation Progress</span>
                  <span className="text-sm font-semibold text-blue-600">{waitTime}/5 minutes</span>
                </div>
                <Progress value={(waitTime / 5) * 100} className="h-3" />
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Your medication is being prepared. Please wait nearby. You will be notified when it's ready for collection.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Ready Stage
  if (stage === "ready") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Medication Ready</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">Ticket #{ticketNumber}</p>
            </div>
          </div>

          {/* Ready Card */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">Your Medication is Ready!</p>
                <p className="text-sm text-green-700 mt-1">Please come to the counter to collect your medication</p>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Important:</strong> Please verify your details and follow the pharmacist's instructions for medication use.
                </AlertDescription>
              </Alert>

              {/* Medication Summary */}
              {currentPrescription?.medications && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-gray-900">Medications to Collect:</p>
                  {currentPrescription.medications.map((med: any, idx: number) => (
                    <p key={idx} className="text-sm text-gray-700">
                      • {med.name} ({med.dosage}) - {med.frequency}
                    </p>
                  ))}
                </div>
              )}

              {/* Collection Button */}
              <Button
                onClick={handleCollectMedication}
                disabled={dispenseMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
              >
                {dispenseMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Collect Medication
                  </>
                )}
              </Button>

              {/* Nearest Clinic Option */}
              {showNearestClinicOption && (
                <Button
                  onClick={handleRedirectToNearestClinic}
                  variant="outline"
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Redirect to Nearest Clinic
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Collected Stage
  if (stage === "collected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Medication Collected</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">Ticket #{ticketNumber}</p>
            </div>
          </div>

          {/* Success Card */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">Collection Complete!</p>
                <p className="text-sm text-green-700 mt-1">Thank you for visiting our clinic</p>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Follow-up Instructions:</strong> Take your medication as prescribed. If you experience any side effects, contact your doctor immediately.
                </AlertDescription>
              </Alert>

              {/* Next Steps */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-gray-900">Next Steps:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ Take medication as prescribed by your doctor</li>
                  <li>✓ Store medication in a cool, dry place</li>
                  <li>✓ Keep the medication packaging for reference</li>
                  <li>✓ Contact clinic if you have any questions</li>
                </ul>
              </div>

              {/* Finish Button */}
              <Button
                onClick={handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finish & Return to Lookup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
