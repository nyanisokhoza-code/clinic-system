import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn } from "lucide-react";

export default function TestLogin() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"nurse" | "doctor" | "dispensary" | "admin">("nurse");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const testCredentials = {
    nurse: { password: "nurse123", name: "Nurse Johnson" },
    doctor: { password: "doctor123", name: "Dr. Smith" },
    dispensary: { password: "dispensary123", name: "Pharmacist Lee" },
    admin: { password: "admin123", name: "Admin User" },
  };

  const handleLogin = () => {
    const credentials = testCredentials[role];

    if (password !== credentials.password) {
      setError(`Invalid password for ${role}`);
      return;
    }

    // Store test user session in localStorage
    const testUser = {
      id: Math.floor(Math.random() * 1000),
      name: credentials.name,
      email: `${role}@clinic.test`,
      role: role,
      clinicId: 1,
    };

    localStorage.setItem("test-user", JSON.stringify(testUser));
    localStorage.setItem("test-user-role", role);

    // Redirect based on role
    if (role === "nurse") {
      setLocation("/vital-signs-checklist");
    } else if (role === "doctor") {
      setLocation("/test-doctor/1");
    } else if (role === "dispensary") {
      setLocation("/test-dispensary");
    } else {
      setLocation("/test-admin");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Clinic System</h1>
          <p className="text-gray-600 mt-2">Staff Test Login</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Role & Login</CardTitle>
            <CardDescription>Choose your role and enter the test password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(["nurse", "doctor", "dispensary", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setError("");
                    }}
                    className={`p-3 rounded-lg font-medium transition-all ${
                      role === r
                        ? "bg-blue-600 text-white ring-2 ring-blue-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Test Password</label>
              <Input
                type="password"
                placeholder="Enter test password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
              <p className="text-xs text-gray-500">
                Password: <span className="font-mono">{testCredentials[role].password}</span>
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Test Credentials:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>Nurse: nurse123</li>
                  <li>Doctor: doctor123</li>
                  <li>Dispensary: dispensary123</li>
                  <li>Admin: admin123</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={!password}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login as {role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>

            {/* Back to Home */}
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center text-sm text-gray-600">
          <p>This is a test login page for development purposes.</p>
          <p>In production, use your clinic's authentication system.</p>
        </div>
      </div>
    </div>
  );
}
