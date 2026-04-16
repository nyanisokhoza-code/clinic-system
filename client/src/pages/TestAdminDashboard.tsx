import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Activity, TrendingUp, AlertCircle, Settings } from "lucide-react";

export default function TestAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "staff" | "settings">("overview");

  // Mock data
  const dashboardStats = [
    { label: "Total Patients", value: "1,234", change: "+12%", icon: Users },
    { label: "Active Queue", value: "23", change: "+5", icon: Activity },
    { label: "Avg Wait Time", value: "12 min", change: "-2 min", icon: TrendingUp },
    { label: "Completion Rate", value: "94%", change: "+3%", icon: AlertCircle },
  ];

  const dailyData = [
    { time: "08:00", patients: 12, completed: 10 },
    { time: "10:00", patients: 28, completed: 25 },
    { time: "12:00", patients: 35, completed: 32 },
    { time: "14:00", patients: 42, completed: 38 },
    { time: "16:00", patients: 38, completed: 35 },
    { time: "18:00", patients: 25, completed: 24 },
  ];

  const departmentData = [
    { name: "General", value: 45, color: "#3b82f6" },
    { name: "Cardiology", value: 25, color: "#ef4444" },
    { name: "Pediatrics", value: 20, color: "#10b981" },
    { name: "Neurology", value: 10, color: "#f59e0b" },
  ];

  const staffList = [
    { id: 1, name: "Dr. Smith", role: "Doctor", status: "Online", patients: 5 },
    { id: 2, name: "Nurse Johnson", role: "Nurse", status: "Online", patients: 8 },
    { id: 3, name: "Pharmacist Lee", role: "Dispensary", status: "Online", patients: 12 },
    { id: 4, name: "Admin User", role: "Admin", status: "Offline", patients: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Clinic System Management & Analytics</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {(["overview", "analytics", "staff", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {dashboardStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-600">{stat.label}</p>
                          <p className="text-2xl font-bold mt-1">{stat.value}</p>
                          <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                        </div>
                        <Icon className="w-8 h-8 text-blue-600 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Flow Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Patient Flow Today</CardTitle>
                  <CardDescription>Patients processed vs. completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="patients" stroke="#3b82f6" name="Checked In" />
                      <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>By Department</CardTitle>
                  <CardDescription>Patient distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Button variant="outline" className="w-full">View Queue</Button>
                <Button variant="outline" className="w-full">Generate Report</Button>
                <Button variant="outline" className="w-full">Manage Staff</Button>
                <Button variant="outline" className="w-full">System Settings</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Analytics</CardTitle>
                <CardDescription>Detailed patient processing metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="patients" fill="#3b82f6" name="Total Checked In" />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Wait Time</span>
                    <span className="font-semibold">12 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Patient Satisfaction</span>
                    <span className="font-semibold">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">System Uptime</span>
                    <span className="font-semibold">99.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Consultation Time</span>
                    <span className="font-semibold">8 minutes</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800">
                      High wait times in Cardiology (avg 18 min)
                    </AlertDescription>
                  </Alert>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      3 staff members offline
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>Active staff and their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Current Patients</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((staff) => (
                        <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">{staff.name}</td>
                          <td className="py-3 px-4">{staff.role}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={staff.status === "Online" ? "default" : "secondary"}
                              className={staff.status === "Online" ? "bg-green-600" : ""}
                            >
                              {staff.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{staff.patients}</td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Staff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Full Name" className="px-3 py-2 border rounded-md" />
                  <select className="px-3 py-2 border rounded-md">
                    <option>Select Role</option>
                    <option>Doctor</option>
                    <option>Nurse</option>
                    <option>Dispensary</option>
                    <option>Admin</option>
                  </select>
                  <input type="email" placeholder="Email" className="px-3 py-2 border rounded-md" />
                  <input type="tel" placeholder="Phone" className="px-3 py-2 border rounded-md" />
                </div>
                <Button className="w-full">Add Staff Member</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clinic Name</label>
                  <input
                    type="text"
                    defaultValue="Central Medical Clinic"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Operating Hours</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="time" defaultValue="08:00" className="px-3 py-2 border rounded-md" />
                    <input type="time" defaultValue="18:00" className="px-3 py-2 border rounded-md" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Daily Patients</label>
                  <input
                    type="number"
                    defaultValue="200"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Average Consultation Time (minutes)</label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm font-medium">Enable SMS Notifications</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm font-medium">Enable Real-time Analytics</span>
                  </label>
                </div>

                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Backup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Last backup: Today at 02:00 AM
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Backup Now
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
