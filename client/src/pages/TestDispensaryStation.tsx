import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle2, AlertCircle, Search, User } from "lucide-react";

interface MedicationCollectionState {
  stage: "lookup" | "arrived" | "verified" | "preparing" | "ready" | "collected";
  patientId?: string;
  patientName?: string;
  medications?: string[];
  waitTime?: number;
  preparedTime?: number;
}

export default function TestDispensaryStation() {
  const [state, setState] = useState<MedicationCollectionState>({ stage: "lookup" });
  const [searchId, setSearchId] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [prepareProgress, setPrepareProgress] = useState(0);

  // Mock patient data
  const mockPatients: Record<string, any> = {
    "1234567890123": {
      name: "John Doe",
      ticketNumber: "CLN-001",
      medications: ["Amoxicillin 500mg", "Paracetamol 500mg", "Vitamin C 1000mg"],
    },
    "9876543210987": {
      name: "Jane Smith",
      ticketNumber: "CLN-002",
      medications: ["Ibuprofen 400mg", "Omeprazole 20mg"],
    },
  };

  const handleLookup = () => {
    const patient = mockPatients[searchId];
    if (patient) {
      setState({
        stage: "arrived",
        patientId: searchId,
        patientName: patient.name,
        medications: patient.medications,
      });
      setSearchId("");
    } else {
      alert("Patient not found");
    }
  };

  const handleVerify = () => {
    if (verificationId === state.patientId) {
      setState({ ...state, stage: "verified" });
      setVerificationId("");
      // Simulate wait time
      const waitTime = Math.floor(Math.random() * 5) + 1;
      setState((prev) => ({ ...prev, waitTime }));
    } else {
      alert("ID verification failed");
    }
  };

  const handleStartPreparation = () => {
    setState({ ...state, stage: "preparing" });
    setPrepareProgress(0);
    // Simulate preparation progress
    const interval = setInterval(() => {
      setPrepareProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setState((prev) => ({ ...prev, stage: "ready", preparedTime: Date.now() }));
          return 100;
        }
        return prev + 20;
      });
    }, 500);
  };

  const handleCollectMedication = () => {
    setState({ ...state, stage: "collected" });
  };

  const handleReset = () => {
    setState({ stage: "lookup" });
    setSearchId("");
    setVerificationId("");
    setPrepareProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Dispensary Station</h1>
          <p className="text-slate-600 mt-1">Medication Collection & Verification</p>
        </div>

        {/* Current Stage Indicator */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {(["lookup", "arrived", "verified", "preparing", "ready", "collected"] as const).map(
            (stage) => (
              <Badge
                key={stage}
                variant={state.stage === stage ? "default" : "outline"}
                className="whitespace-nowrap"
              >
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </Badge>
            )
          )}
        </div>

        {/* Stage 1: Lookup */}
        {state.stage === "lookup" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Patient Lookup
              </CardTitle>
              <CardDescription>Search patient by SA ID or Ticket Number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">SA ID Number or Ticket Number</label>
                <Input
                  placeholder="Enter SA ID (e.g., 1234567890123)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Test IDs: 1234567890123 or 9876543210987
                </p>
              </div>
              <Button onClick={handleLookup} className="w-full" disabled={!searchId}>
                <Search className="w-4 h-4 mr-2" />
                Search Patient
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stage 2: Arrived */}
        {state.stage === "arrived" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Arrived
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Please verify patient identity before proceeding
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Patient Name</p>
                <p className="text-lg font-semibold">{state.patientName}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Verify SA ID</label>
                <Input
                  placeholder="Enter SA ID to verify"
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button onClick={handleVerify} className="w-full" disabled={!verificationId}>
                Verify Patient Identity
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stage 3: Verified */}
        {state.stage === "verified" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Patient Verified
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Patient identity verified successfully
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Patient</p>
                  <p className="font-semibold">{state.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Prescribed Medications</p>
                  <ul className="mt-2 space-y-1">
                    {state.medications?.map((med, idx) => (
                      <li key={idx} className="text-sm">
                        • {med}
                      </li>
                    ))}
                  </ul>
                </div>
                {state.waitTime && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    Estimated wait: {state.waitTime} minutes
                  </div>
                )}
              </div>

              <Button onClick={handleStartPreparation} className="w-full bg-blue-600 hover:bg-blue-700">
                Start Medication Preparation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stage 4: Preparing */}
        {state.stage === "preparing" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Preparing Medication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Preparation Progress</span>
                  <span className="font-semibold">{prepareProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${prepareProgress}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Medications Being Prepared</p>
                <ul className="mt-2 space-y-1">
                  {state.medications?.map((med, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      {prepareProgress >= (idx + 1) * 33 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                      )}
                      {med}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-slate-600 text-center">Please wait while we prepare the medication...</p>
            </CardContent>
          </Card>
        )}

        {/* Stage 5: Ready */}
        {state.stage === "ready" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Medication Ready
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Medication is ready for collection
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Patient</p>
                  <p className="font-semibold">{state.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Medications Ready</p>
                  <ul className="mt-2 space-y-1">
                    {state.medications?.map((med, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        {med}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-900">Pharmacist Instructions:</p>
                <p className="text-sm text-amber-800 mt-1">
                  Please review medication labels with patient and provide usage instructions before collection.
                </p>
              </div>

              <Button onClick={handleCollectMedication} className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Medication Collection
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stage 6: Collected */}
        {state.stage === "collected" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Collection Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Patient has successfully collected their medication
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Patient</p>
                  <p className="font-semibold">{state.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Medications Collected</p>
                  <ul className="mt-2 space-y-1">
                    {state.medications?.map((med, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        {med}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">Follow-up Instructions:</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Take medications as prescribed by the doctor</li>
                  <li>• Store in a cool, dry place away from sunlight</li>
                  <li>• Do not share medications with others</li>
                  <li>• Contact clinic if you experience any side effects</li>
                </ul>
              </div>

              <Button onClick={handleReset} className="w-full" variant="outline">
                Process Next Patient
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
