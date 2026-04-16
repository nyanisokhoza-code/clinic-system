import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import PatientRegistration from "@/pages/PatientRegistration";
import PatientProfile from "@/pages/PatientProfile";
import QueueCheckIn from "@/pages/QueueCheckIn";
import QueueStatus from "@/pages/QueueStatus";
import StaffQueueDashboard from "@/pages/StaffQueueDashboard";
import WayfindingGuide from "@/pages/WayfindingGuide";
import DigitalConcierge from "@/pages/DigitalConcierge";
import DoctorConsultation from "@/pages/DoctorConsultation";
import StaffDashboard from "@/pages/StaffDashboard";
import DispensaryDashboard from "@/pages/DispensaryDashboard";
import ClinicFinder from "@/pages/ClinicFinder";
import SMSNotifications from "@/pages/SMSNotifications";
import AIIntakeAssistant from "@/pages/AIIntakeAssistant";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import TestLogin from "@/pages/TestLogin";
import TestDoctorConsultation from "@/pages/TestDoctorConsultation";
import TestDispensaryStation from "@/pages/TestDispensaryStation";
import TestAdminDashboard from "@/pages/TestAdminDashboard";
import VitalSignsChecklist from "@/pages/VitalSignsChecklist";
import MedicationCollectionStation from "@/pages/MedicationCollectionStation";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import OfflineIndicator from "./components/OfflineIndicator";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/register"} component={PatientRegistration} />
      <Route path={"/patient/:patientId"} component={PatientProfile} />
      <Route path={"/queue-checkin/:patientId"} component={QueueCheckIn} />
      <Route path={"/queue-status/:patientId"} component={QueueStatus} />
      <Route path={"/staff/queue"} component={StaffQueueDashboard} />
      <Route path={"/wayfinding/:patientId"} component={WayfindingGuide} />
      <Route path={"/concierge/:patientId"} component={DigitalConcierge} />
      <Route path={"/doctor-consultation/:patientId"} component={DoctorConsultation} />
      <Route path={"/staff/dashboard"} component={StaffDashboard} />
      <Route path={"/dispensary/dashboard"} component={DispensaryDashboard} />
      <Route path={"/clinic-finder"} component={ClinicFinder} />
      <Route path={"/sms-notifications"} component={SMSNotifications} />
      <Route path={"/ai-intake"} component={AIIntakeAssistant} />
      <Route path={"/analytics"} component={AnalyticsDashboard} />
      <Route path={"/test-login"} component={TestLogin} />
      <Route path={"/vital-signs-checklist"} component={VitalSignsChecklist} />
      <Route path={"/vital-signs-checklist/:patientId/:queueId"} component={VitalSignsChecklist} />      <Route path={"/medication-collection"} component={MedicationCollectionStation} />
      <Route path={"/test-doctor/:patientId"} component={TestDoctorConsultation} />
      <Route path={"/test-dispensary"} component={TestDispensaryStation} />
      <Route path={"/test-admin"} component={TestAdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <OfflineIndicator />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
