import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function PatientRegistration() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"search" | "register">("search");
  const [saIdNumber, setSaIdNumber] = useState("");
  const [existingPatient, setExistingPatient] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Registration form state
  const [formData, setFormData] = useState({
    saIdNumber: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodType: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  // tRPC mutations
  const searchPatient = trpc.patient.getBySAId.useQuery(
    { saIdNumber },
    { enabled: false }
  );

  const registerMutation = trpc.patient.register.useMutation({
    onSuccess: (data) => {
      toast.success("Patient registered successfully!");
      setLocation(`/queue-checkin/${data.patientId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register patient");
    },
  });

  const handleSearchPatient = async () => {
    setSearchError("");
    setExistingPatient(null);

    if (!saIdNumber || saIdNumber.length !== 13) {
      setSearchError("Please enter a valid 13-digit South African ID number");
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchPatient.refetch();
      if (result.data) {
        setExistingPatient(result.data);
        setLocation(`/queue-checkin/${result.data.id}`);
      } else {
        setStep("register");
        setFormData((prev) => ({ ...prev, saIdNumber }));
      }
    } catch (error) {
      setSearchError("Failed to search for patient");
    } finally {
      setIsSearching(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.saIdNumber || formData.saIdNumber.length !== 13) {
      errors.saIdNumber = "Valid 13-digit SA ID is required";
    }
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (formData.email && !formData.email.includes("@")) {
      errors.email = "Valid email is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsRegistering(true);
    try {
      await registerMutation.mutateAsync({
        saIdNumber: formData.saIdNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        gender: (formData.gender as any) || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        bloodType: formData.bloodType || undefined,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl">Patient Registration</CardTitle>
          <CardDescription className="text-blue-100">
            Register or search for a patient in the system
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {step === "search" ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Search for Existing Patient</h3>
                <p className="text-sm text-blue-800">
                  Enter the patient's South African ID number to search for their existing profile
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-sa-id" className="text-sm font-medium">
                    South African ID Number (13 digits)
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="search-sa-id"
                      type="text"
                      placeholder="e.g., 8001015009087"
                      value={saIdNumber}
                      onChange={(e) => setSaIdNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
                      maxLength={13}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSearchPatient}
                      disabled={isSearching || saIdNumber.length !== 13}
                      className="px-6"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </div>
                </div>

                {searchError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}

                {existingPatient && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Patient found: {existingPatient.firstName} {existingPatient.lastName}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setStep("register");
                  setFormData((prev) => ({ ...prev, saIdNumber }));
                }}
                variant="outline"
                className="w-full"
              >
                Register New Patient
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegisterPatient} className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="medical">Medical</TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sa-id" className="text-sm font-medium">
                        South African ID *
                      </Label>
                      <Input
                        id="sa-id"
                        type="text"
                        placeholder="13-digit ID number"
                        value={formData.saIdNumber}
                        onChange={(e) =>
                          handleInputChange("saIdNumber", e.target.value.replace(/\D/g, "").slice(0, 13))
                        }
                        maxLength={13}
                        className={formErrors.saIdNumber ? "border-red-500" : ""}
                      />
                      {formErrors.saIdNumber && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.saIdNumber}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="dob" className="text-sm font-medium">
                        Date of Birth
                      </Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first-name" className="text-sm font-medium">
                        First Name *
                      </Label>
                      <Input
                        id="first-name"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className={formErrors.firstName ? "border-red-500" : ""}
                      />
                      {formErrors.firstName && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="last-name" className="text-sm font-medium">
                        Last Name *
                      </Label>
                      <Input
                        id="last-name"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className={formErrors.lastName ? "border-red-500" : ""}
                      />
                      {formErrors.lastName && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium">
                        Gender
                      </Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="blood-type" className="text-sm font-medium">
                        Blood Type
                      </Label>
                      <Select value={formData.bloodType} onValueChange={(value) => handleInputChange("bloodType", value)}>
                        <SelectTrigger id="blood-type">
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Contact Information Tab */}
                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+27 123 456 7890"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={formErrors.email ? "border-red-500" : ""}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Street address, city, postal code"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergency-name" className="text-sm font-medium">
                          Contact Name
                        </Label>
                        <Input
                          id="emergency-name"
                          type="text"
                          placeholder="Jane Doe"
                          value={formData.emergencyContactName}
                          onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="emergency-phone" className="text-sm font-medium">
                          Contact Phone
                        </Label>
                        <Input
                          id="emergency-phone"
                          type="tel"
                          placeholder="+27 123 456 7890"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Medical Information Tab */}
                <TabsContent value="medical" className="space-y-4 mt-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      Medical information can be added or updated during the patient's first consultation.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                  setStep("search");
                  setSaIdNumber("");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
