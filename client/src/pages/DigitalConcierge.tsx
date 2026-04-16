import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, MessageCircle, Lightbulb, MapPin, Clock, Phone, Loader2, Send } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "concierge";
  content: string;
  timestamp: Date;
}

export default function DigitalConcierge() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "concierge",
      content:
        "Hello! I'm your digital concierge. I'm here to help guide you through your hospital visit. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I understand. Let me help you find the right department. Based on your concern, I recommend visiting the General Practice department first.",
        "That's helpful information. The Vitals Station is located in Room 101 on the ground floor. It should take about 5 minutes to walk there from your current location.",
        "You can find the Waiting Area B on the second floor. Take the elevator and follow the signs. The estimated wait time is about 15 minutes.",
        "Your consultation is scheduled for 2:30 PM in Consultation Room 3 on the third floor. Please proceed there when your queue number is called.",
        "The Dispensary is located on the ground floor. Your prescription will be ready in about 10 minutes. Please proceed there after your consultation.",
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const conciergeMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "concierge",
        content: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, conciergeMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const quickActions = [
    { icon: "📍", label: "Where should I go?", question: "I'm not sure which department to visit" },
    { icon: "⏱️", label: "How long will it take?", question: "What's the estimated wait time?" },
    { icon: "🚶", label: "How do I get there?", question: "Can you give me directions?" },
    { icon: "📋", label: "What do I need?", question: "What documents do I need to bring?" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setLocation(`/patient/${patientId}`)}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Digital Concierge</h1>
          <div className="w-10"></div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">24/7 Virtual Assistant</p>
                <p className="text-sm text-blue-800 mt-1">
                  Ask me anything about your hospital visit. I'm here to help guide you through each step.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="h-96 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Chat with Concierge</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.type === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.type === "user" ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Input Area */}
          <div className="border-t p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Type your question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Quick Questions:</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                onClick={() => {
                  setInputValue(action.question);
                  setTimeout(() => handleSendMessage(), 100);
                }}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-2 text-center"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Helpful Info */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Helpful Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-900">Main Reception</p>
                <p className="text-xs text-green-800">Ground Floor, Building A</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-900">Operating Hours</p>
                <p className="text-xs text-green-800">Monday - Friday: 7:00 AM - 6:00 PM</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-900">Emergency Support</p>
                <p className="text-xs text-green-800">Call: 0800-CLINIC-1 (24/7)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
