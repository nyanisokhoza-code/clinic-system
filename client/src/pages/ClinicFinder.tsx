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
  MapPin,
  Clock,
  Phone,
  Mail,
  Search,
  Navigation,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function ClinicFinder() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Default to Johannesburg if geolocation fails
          setLatitude(-26.2023);
          setLongitude(28.0436);
        }
      );
    }
  }, []);

  // Queries
  const nearestClinicsQuery = trpc.clinicCollection.getNearestClinics.useQuery(
    {
      latitude: latitude || 0,
      longitude: longitude || 0,
      limit: 10,
    },
    { enabled: latitude !== null && longitude !== null }
  );

  const searchClinicsQuery = trpc.clinicCollection.searchClinics.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 0 }
  );

  const clinicDetailsQuery = trpc.clinicCollection.getClinicDetails.useQuery(
    { clinicId: selectedClinic || 0 },
    { enabled: selectedClinic !== null }
  );

  const nearestClinics = nearestClinicsQuery.data || [];
  const searchResults = searchClinicsQuery.data || [];
  const clinicDetails = clinicDetailsQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Clinic Finder</h1>
              <p className="text-gray-600 mt-1">Find the nearest clinic for medication collection</p>
            </div>
          </div>
        </div>

        {/* Location Status */}
        {latitude && longitude && (
          <Alert className="bg-green-50 border-green-200">
            <Navigation className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Location detected: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </AlertDescription>
          </Alert>
        )}

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search clinics by name or location..."
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clinics List */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="nearest" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nearest" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Nearest ({nearestClinics.length})
                </TabsTrigger>
                <TabsTrigger value="search" className="gap-2">
                  <Search className="w-4 h-4" />
                  Search ({searchResults.length})
                </TabsTrigger>
              </TabsList>

              {/* Nearest Clinics Tab */}
              <TabsContent value="nearest" className="space-y-4">
                {nearestClinicsQuery.isLoading ? (
                  <Card>
                    <CardContent className="pt-6 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </CardContent>
                  </Card>
                ) : nearestClinics.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No clinics found nearby</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  nearestClinics.map((clinic) => (
                    <Card
                      key={clinic.id}
                      className={`cursor-pointer hover:shadow-lg transition-all ${
                        selectedClinic === clinic.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : ""
                      }`}
                      onClick={() => setSelectedClinic(clinic.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {clinic.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {clinic.type === "hospital" ? "🏥 Hospital" : "🏥 Clinic"}
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            {clinic.distance?.toString()} km
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <p className="text-gray-700">{clinic.address}</p>
                          </div>
                          {clinic.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <p className="text-gray-700">{clinic.phone}</p>
                            </div>
                          )}
                          {clinic.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <p className="text-gray-700">{clinic.email}</p>
                            </div>
                          )}
                        </div>

                        {clinic.operatingHours ? (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <p className="font-semibold text-sm text-gray-900">
                                Operating Hours
                              </p>
                            </div>
                            <p className="text-sm text-gray-700">Available</p>
                          </div>
                        ) : null}
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
                        <p className="text-gray-600">Enter a search query to find clinics</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : searchClinicsQuery.isLoading ? (
                  <Card>
                    <CardContent className="pt-6 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </CardContent>
                  </Card>
                ) : searchResults.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No clinics found matching "{searchQuery}"</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.map((clinic) => (
                    <Card
                      key={clinic.id}
                      className={`cursor-pointer hover:shadow-lg transition-all ${
                        selectedClinic === clinic.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : ""
                      }`}
                      onClick={() => setSelectedClinic(clinic.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {clinic.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {clinic.type === "hospital" ? "🏥 Hospital" : "🏥 Clinic"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <p className="text-gray-700">{clinic.address}</p>
                          </div>
                          {clinic.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <p className="text-gray-700">{clinic.phone}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Clinic Details Panel */}
          <div>
            {selectedClinic && clinicDetails ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Selected Clinic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {clinicDetails.name}
                    </h3>
                    <Badge className="mt-2 bg-blue-100 text-blue-800">
                      {clinicDetails.type?.toString()}
                    </Badge>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-600 font-semibold">Address</p>
                        <p className="text-gray-900">{clinicDetails.address}</p>
                      </div>
                    </div>

                    {clinicDetails.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-600 font-semibold">Phone</p>
                          <p className="text-gray-900">{clinicDetails.phone}</p>
                        </div>
                      </div>
                    )}

                    {clinicDetails.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-600 font-semibold">Email</p>
                          <p className="text-gray-900">{clinicDetails.email}</p>
                        </div>
                      </div>
                    )}

                    {clinicDetails.operatingHours ? (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-gray-600 font-semibold">Hours</p>
                            <p className="text-gray-900">Available</p>
                          </div>
                      </div>
                    ) : null}
                  </div>

                  <Button
                    onClick={() => {
                      toast.success("Clinic selected for medication collection");
                      setLocation("/");
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 mt-4"
                  >
                    Confirm Selection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">
                      Select a clinic to view details
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Select a clinic to collect your medications. You can choose any clinic that has your prescription ready.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
