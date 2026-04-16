import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
} from "lucide-react";

export default function AnalyticsDashboard() {
  const [, setLocation] = useLocation();
  const [clinicId, setClinicId] = useState<number | undefined>(undefined);

  // Query analytics data
  const queueStatsQuery = trpc.analytics.getQueueStats.useQuery({
    clinicId,
  });
  const consultationStatsQuery = trpc.analytics.getConsultationStats.useQuery({
    clinicId,
  });
  const prescriptionStatsQuery = trpc.analytics.getPrescriptionStats.useQuery({
    clinicId,
  });
  const staffProductivityQuery = trpc.analytics.getStaffProductivity.useQuery({
    clinicId,
  });
  const patientFlowQuery = trpc.analytics.getPatientFlow.useQuery({
    clinicId,
  });
  const notificationStatsQuery = trpc.analytics.getNotificationStats.useQuery({});
  const departmentPerfQuery = trpc.analytics.getDepartmentPerformance.useQuery({
    clinicId,
  });
  const healthCheckQuery = trpc.analytics.getHealthCheckSummary.useQuery({
    clinicId,
  });

  const queueStats = queueStatsQuery.data;
  const consultationStats = consultationStatsQuery.data;
  const prescriptionStats = prescriptionStatsQuery.data;
  const staffProductivity = staffProductivityQuery.data;
  const patientFlow = patientFlowQuery.data;
  const notificationStats = notificationStatsQuery.data;
  const departmentPerf = departmentPerfQuery.data;
  const healthCheck = healthCheckQuery.data;

  const isLoading =
    queueStatsQuery.isLoading ||
    consultationStatsQuery.isLoading ||
    prescriptionStatsQuery.isLoading;

  // Prepare chart data
  const queuePriorityData = queueStats
    ? [
        { name: "Routine", value: queueStats.byPriority.routine },
        { name: "Urgent", value: queueStats.byPriority.urgent },
        { name: "Emergency", value: queueStats.byPriority.emergency },
      ]
    : [];

  const prescriptionStatusData = prescriptionStats
    ? [
        { name: "Pending", value: prescriptionStats.byStatus.pending },
        { name: "Ready", value: prescriptionStats.byStatus.ready },
        { name: "Dispensed", value: prescriptionStats.byStatus.dispensed },
        { name: "Cancelled", value: prescriptionStats.byStatus.cancelled },
      ]
    : [];

  const notificationChannelData = notificationStats
    ? [
        { name: "SMS", value: notificationStats.byChannel.sms },
        { name: "Email", value: notificationStats.byChannel.email },
        { name: "In-App", value: notificationStats.byChannel.inApp },
      ]
    : [];

  const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => setLocation("/")} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-8 h-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Hospital performance metrics and patient flow analytics
              </p>
            </div>
          </div>
        </div>

        {/* Health Status */}
        {healthCheck && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">System Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <p className="font-semibold text-green-800 capitalize">
                      {healthCheck.systemStatus}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patients Queued (Today)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {healthCheck.todayMetrics.patientsQueued}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Consultations (Today)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {healthCheck.todayMetrics.consultationsCompleted}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prescriptions (Today)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {healthCheck.todayMetrics.prescriptionsCreated}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {queueStats && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Total Queued
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{queueStats.totalQueued}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Completion Rate: {queueStats.completionRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          )}

          {queueStats && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Avg Wait Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(queueStats.avgWaitTimeMinutes)} min
                </p>
                <p className="text-xs text-gray-600 mt-1">Per patient</p>
              </CardContent>
            </Card>
          )}

          {consultationStats && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Consultations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {consultationStats.totalConsultations}
                </p>
                <p className="text-xs text-gray-600 mt-1">Total completed</p>
              </CardContent>
            </Card>
          )}

          {prescriptionStats && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Dispensing Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {prescriptionStats.dispensingRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 mt-1">Prescriptions dispensed</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts */}
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Queue by Priority */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Queue by Priority</CardTitle>
                  <CardDescription>Distribution of patient priorities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={queuePriorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {queuePriorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Patient Flow */}
              {patientFlow && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daily Patient Flow</CardTitle>
                    <CardDescription>
                      Avg: {patientFlow.avgPatientsPerDay.toFixed(0)} patients/day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={patientFlow.dailyPatientFlow}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="patientCount"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Prescription Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prescription Status</CardTitle>
                  <CardDescription>Current prescription workflow status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prescriptionStatusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Prescription Stats */}
              {prescriptionStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Prescription Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Prescriptions</span>
                        <span className="font-semibold">
                          {prescriptionStats.totalPrescriptions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending</span>
                        <Badge variant="outline">
                          {prescriptionStats.byStatus.pending}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Ready</span>
                        <Badge variant="outline">{prescriptionStats.byStatus.ready}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Dispensed</span>
                        <Badge variant="outline">
                          {prescriptionStats.byStatus.dispensed}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cancelled</span>
                        <Badge variant="outline">
                          {prescriptionStats.byStatus.cancelled}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-4">
            {staffProductivity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Staff Productivity</CardTitle>
                  <CardDescription>
                    Avg consultations per doctor:{" "}
                    {staffProductivity.avgConsultationsPerDoctor.toFixed(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staffProductivity.staffMetrics.map((staff: any) => (
                      <div key={staff.doctorId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">{staff.doctorName}</span>
                        <Badge>{staff.consultationCount} consultations</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Notification Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notification Channels</CardTitle>
                  <CardDescription>Distribution by channel</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={notificationChannelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {notificationChannelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Notification Stats */}
              {notificationStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notification Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Notifications</span>
                        <span className="font-semibold">
                          {notificationStats.totalNotifications}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivery Rate</span>
                        <Badge className="bg-green-100 text-green-800">
                          {notificationStats.deliveryRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sent</span>
                        <Badge variant="outline">{notificationStats.byStatus.sent}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Failed</span>
                        <Badge variant="outline">{notificationStats.byStatus.failed}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Department Performance */}
        {departmentPerf && (
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Consultations by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentPerf.departmentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="consultations" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
