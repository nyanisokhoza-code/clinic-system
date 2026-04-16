import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Users, Stethoscope, Pill, Clock, BarChart3, MapPin, LogOut, LogIn, MessageSquare, Brain } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const features = [
    {
      icon: Users,
      title: "Patient Registration",
      description: "Register new patients or search for existing profiles using South African ID",
      action: "Go to Registration",
      href: "/register",
    },
    {
      icon: Stethoscope,
      title: "Digital Consultations",
      description: "Doctors can record consultations and generate digital prescriptions",
      action: "Staff Portal",
      href: "/staff/dashboard",
      disabled: false,
    },
    {
      icon: Pill,
      title: "Dispensary Management",
      description: "Real-time prescription queue and medication dispensing tracking",
      action: "Dispensary Dashboard",
      href: "/dispensary/dashboard",
      disabled: false,
    },
    {
      icon: Clock,
      title: "Queue Management",
      description: "Virtual queuing system with real-time wait time estimates",
      action: "Check Queue",
      href: "#",
      disabled: true,
    },
    {
      icon: MapPin,
      title: "Clinic Finder",
      description: "Locate nearest clinics for medication collection",
      action: "Find Clinics",
      href: "/clinic-finder",
      disabled: false,
    },
    {
      icon: MessageSquare,
      title: "SMS Notifications",
      description: "Send SMS alerts to patients for queue and prescription updates",
      action: "Manage SMS",
      href: "/sms-notifications",
      disabled: false,
    },
    {
      icon: Brain,
      title: "AI Intake Assistant",
      description: "AI-powered symptom analysis and department recommendations",
      action: "Start Assessment",
      href: "/ai-intake",
      disabled: false,
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Hospital performance metrics and patient flow analytics",
      action: "View Dashboard",
      href: "/analytics",
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Clinic System</h1>
              <p className="text-xs text-gray-500">Hospital Management Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
            ) : isAuthenticated ? (
              <>
                <div className="text-right mr-4">
                  <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-500">{user?.role || "user"}</p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/test-login")}
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <LogIn className="w-4 h-4" />
                  Staff Login
                </Button>
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <LogIn className="w-4 h-4" />
                  OAuth Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Transforming Healthcare in South Africa
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A comprehensive digital platform designed to streamline patient care, eliminate queues, and empower healthcare workers in South African public facilities.
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Users className="w-5 h-5" />
              Register Patient
            </Button>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <LogIn className="w-5 h-5" />
              Staff Login
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">100%</p>
                <p className="text-sm text-gray-600 mt-1">Digital Records</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">24/7</p>
                <p className="text-sm text-gray-600 mt-1">System Availability</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">POPIA</p>
                <p className="text-sm text-gray-600 mt-1">Compliant</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">Core Features</h3>
          <p className="text-gray-600">Comprehensive tools for modern healthcare delivery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className={`hover:shadow-lg transition-shadow ${
                  feature.disabled ? "opacity-60" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    {feature.disabled && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      if (!feature.disabled) {
                        setLocation(feature.href);
                      }
                    }}
                    variant={feature.disabled ? "outline" : "default"}
                    disabled={feature.disabled}
                    className="w-full"
                  >
                    {feature.action}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="text-3xl font-bold">Ready to Transform Your Clinic?</h3>
          <p className="text-blue-100 max-w-2xl mx-auto">
            Join South African healthcare facilities using our platform to improve patient care and reduce operational burden.
          </p>
          <Button
            onClick={() => setLocation("/register")}
            size="lg"
            variant="secondary"
            className="gap-2"
          >
            <Users className="w-5 h-5" />
            Get Started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-3">About</h4>
              <p className="text-sm">
                Clinic System is designed to modernize healthcare delivery in South African public facilities.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Features</h4>
              <ul className="text-sm space-y-1">
                <li><a href="#" className="hover:text-white">Patient Management</a></li>
                <li><a href="#" className="hover:text-white">Queue Management</a></li>
                <li><a href="#" className="hover:text-white">Prescriptions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Compliance</h4>
              <ul className="text-sm space-y-1">
                <li>POPIA Compliant</li>
                <li>Data Encrypted</li>
                <li>Audit Logging</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Clinic System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
