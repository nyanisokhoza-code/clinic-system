import { useState } from "react";
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
  MessageSquare,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Send,
  Copy,
} from "lucide-react";

export default function SMSNotifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Queries
  const templatesQuery = trpc.smsOffline.getSMSTemplates.useQuery();
  const contactPrefsQuery = trpc.smsOffline.getContactPreferences.useQuery(
    { patientId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Mutations
  const sendSMSMutation = trpc.smsOffline.sendSMS.useMutation();

  const templates = templatesQuery.data || {};
  const contactPrefs = contactPrefsQuery.data;

  const handleSendSMS = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      await sendSMSMutation.mutateAsync({
        phoneNumber,
        message,
        notificationType: (selectedTemplate as any) || "queue_called",
        patientId: user?.id,
      });

      toast.success("SMS sent successfully");
      setPhoneNumber("");
      setMessage("");
                      setSelectedTemplate("");
    } catch (error) {
      toast.error("Failed to send SMS");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">SMS Notifications</h1>
              <p className="text-gray-600 mt-1">Send and manage SMS notifications to patients</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SMS Composer */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send SMS
                </CardTitle>
                <CardDescription>
                  Send SMS notifications to patients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="+27 or 0 followed by 9 digits"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {contactPrefs?.phone && (
                      <Button
                        onClick={() => setPhoneNumber(contactPrefs.phone || "")}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Use Patient
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Format: +27123456789 or 0123456789
                  </p>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Template
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(templates).map(([key, template]: [string, any]) => (
                      <Button
                        key={key}
                        onClick={() => {
                          setSelectedTemplate(key as string);
                          setMessage(template.template);
                        }}
                        variant={selectedTemplate === key ? "default" : "outline"}
                        className="text-xs h-auto py-2 text-left justify-start"
                      >
                        <div className="truncate">
                          <div className="font-semibold">{template.title}</div>
                          <div className="text-xs opacity-75 truncate">
                            {template.template}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Message
                  </label>
                  <textarea
                    placeholder="Enter your SMS message (max 160 characters for single SMS)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 160))}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600">
                      {message.length}/160 characters
                    </p>
                    {message.length > 160 && (
                      <Badge className="bg-amber-100 text-amber-800">
                        Will be split into {Math.ceil(message.length / 160)} SMS
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendSMS}
                  disabled={sendSMSMutation.isPending || !phoneNumber.trim() || !message.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {sendSMSMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send SMS
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* SMS Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SMS Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>Use South African phone number format (+27 or 0)</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>Keep messages concise and clear</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>Messages over 160 characters will be split into multiple SMS</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>Include relevant details like queue numbers or clinic names</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Preferences */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactPrefs ? (
                  <>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">
                        Phone Number
                      </p>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                        {contactPrefs.phone || "Not set"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">
                        Email
                      </p>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                        {contactPrefs.email || "Not set"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-semibold">
                        Notification Channels
                      </p>
                      <div className="space-y-1">
                        <Badge
                          className={`w-full justify-center ${
                            contactPrefs.smsEnabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {contactPrefs.smsEnabled ? "✓" : "✗"} SMS
                        </Badge>
                        <Badge
                          className={`w-full justify-center ${
                            contactPrefs.emailEnabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {contactPrefs.emailEnabled ? "✓" : "✗"} Email
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Alert */}
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                SMS notifications are sent immediately. Ensure phone numbers are in the correct format.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
