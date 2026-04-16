import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Search,
  RefreshCw,
  Loader2,
  ArrowLeft,
  CheckCheck,
} from "lucide-react";

export default function DispensaryDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedClinic, setSelectedClinic] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const statsQuery = trpc.dispensary.getDispensaryStats.useQuery(
    { clinicId: parseInt(selectedClinic) },
    { refetchInterval: 3000 }
  );

  const pendingQuery = trpc.dispensary.getPendingPrescriptions.useQuery(
    { clinicId: parseInt(selectedClinic) },
    { refetchInterval: 3000 }
  );

  const readyQuery = trpc.dispensary.getReadyPrescriptions.useQuery(
    { clinicId: parseInt(selectedClinic) },
    { refetchInterval: 3000 }
  );

  const searchQuery_mutation = trpc.dispensary.searchPrescriptions.useQuery(
    { clinicId: parseInt(selectedClinic), query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  // Mutations
  const markAsReadyMutation = trpc.dispensary.markAsReady.useMutation({
    onSuccess: () => {
      toast.success("Prescription marked as ready. Patient notified.");
      pendingQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark prescription as ready");
    },
  });

  const dispenseMutation = trpc.dispensary.dispensePrescription.useMutation({
    onSuccess: () => {
      toast.success("Prescription dispensed successfully");
      readyQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to dispense prescription");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You must be logged in to access this page</AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full mt-4"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;
  const pending = pendingQuery.data || [];
  const ready = readyQuery.data || [];
  const searchResults = searchQuery_mutation.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dispensary Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage prescriptions and medication fulfillment</p>
            </div>
          </div>
          <Button
            onClick={() => {
              pendingQuery.refetch();
              readyQuery.refetch();
              statsQuery.refetch();
            }}
            variant="outline"
            size="sm"
            disabled={pendingQuery.isFetching || readyQuery.isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                pendingQuery.isFetching || readyQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-600">{stats.ready}</p>
                  <p className="text-sm text-gray-600 mt-1">Ready for Pickup</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">{stats.dispensed}</p>
                  <p className="text-sm text-gray-600 mt-1">Dispensed Today</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
                  <p className="text-sm text-gray-600 mt-1">Total Prescriptions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name or SA ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="gap-2">
              <Package className="w-4 h-4" />
              Ready ({ready.length})
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Search Results ({searchResults.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Prescriptions Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pending.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
                    <p className="text-gray-600">No pending prescriptions</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              pending.map((rx) => (
                <Card key={rx.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Patient Info */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Patient</p>
                        <p className="font-bold text-gray-900">
                          {rx.patient?.firstName} {rx.patient?.lastName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          SA ID: {rx.patient?.saIdNumber}
                        </p>
                      </div>

                      {/* Medications */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Medications</p>
                        <div className="space-y-1 mt-1">
                          {Array.isArray(rx.medications) &&
                            rx.medications.slice(0, 2).map((med: any, idx: number) => (
                              <p key={idx} className="text-sm text-gray-900">
                                {med.name} ({med.dosage})
                              </p>
                            ))}
                          {Array.isArray(rx.medications) && rx.medications.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{rx.medications.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Prescription Details */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Details</p>
                        <div className="space-y-1 mt-1">
                          <Badge
                            className={
                              rx.isRepeat
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {rx.isRepeat ? "Chronic" : "New"}
                          </Badge>
                          <p className="text-xs text-gray-600">
                            {new Date(rx.prescriptionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 justify-end">
                        <Button
                          onClick={() => markAsReadyMutation.mutate({ prescriptionId: rx.id })}
                          disabled={markAsReadyMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 gap-2"
                        >
                          {markAsReadyMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                          Mark Ready
                        </Button>
                        <Button
                          onClick={() => setLocation(`/prescription/${rx.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Ready for Pickup Tab */}
          <TabsContent value="ready" className="space-y-4">
            {ready.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No prescriptions ready for pickup</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              ready.map((rx) => (
                <Card key={rx.id} className="hover:shadow-lg transition-shadow bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Patient Info */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Patient</p>
                        <p className="font-bold text-gray-900">
                          {rx.patient?.firstName} {rx.patient?.lastName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          SA ID: {rx.patient?.saIdNumber}
                        </p>
                      </div>

                      {/* Medications */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Medications</p>
                        <div className="space-y-1 mt-1">
                          {Array.isArray(rx.medications) &&
                            rx.medications.slice(0, 2).map((med: any, idx: number) => (
                              <p key={idx} className="text-sm text-gray-900">
                                {med.name} ({med.dosage})
                              </p>
                            ))}
                          {Array.isArray(rx.medications) && rx.medications.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{rx.medications.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Status</p>
                        <Badge className="bg-green-100 text-green-800 mt-1">Ready for Pickup</Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 justify-end">
                        <Button
                          onClick={() => dispenseMutation.mutate({ prescriptionId: rx.id })}
                          disabled={dispenseMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 gap-2"
                        >
                          {dispenseMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCheck className="w-4 h-4" />
                          )}
                          Dispense
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Search Results Tab */}
          <TabsContent value="search" className="space-y-4">
            {searchQuery.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Enter a search query to find prescriptions</p>
                  </div>
                </CardContent>
              </Card>
            ) : searchResults.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No prescriptions found matching "{searchQuery}"</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              searchResults.map((rx) => (
                <Card key={rx.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Patient Info */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Patient</p>
                        <p className="font-bold text-gray-900">
                          {rx.patient?.firstName} {rx.patient?.lastName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          SA ID: {rx.patient?.saIdNumber}
                        </p>
                      </div>

                      {/* Medications */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Medications</p>
                        <div className="space-y-1 mt-1">
                          {Array.isArray(rx.medications) &&
                            rx.medications.slice(0, 2).map((med: any, idx: number) => (
                              <p key={idx} className="text-sm text-gray-900">
                                {med.name} ({med.dosage})
                              </p>
                            ))}
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Status</p>
                        <Badge
                          className={
                            rx.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : rx.status === "ready"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {rx.status}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 justify-end">
                        {rx.status === "pending" && (
                          <Button
                            onClick={() => markAsReadyMutation.mutate({ prescriptionId: rx.id })}
                            disabled={markAsReadyMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 gap-2 text-xs"
                          >
                            Mark Ready
                          </Button>
                        )}
                        {rx.status === "ready" && (
                          <Button
                            onClick={() => dispenseMutation.mutate({ prescriptionId: rx.id })}
                            disabled={dispenseMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 gap-2 text-xs"
                          >
                            Dispense
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This dashboard updates automatically every 3 seconds. Mark prescriptions as ready to notify patients, then dispense when they arrive for pickup.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
