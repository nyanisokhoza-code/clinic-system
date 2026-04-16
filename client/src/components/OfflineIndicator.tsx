import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, Loader2 } from "lucide-react";
import { offlineSync } from "@/services/offlineSync";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Update status
    const updateStatus = () => {
      setIsOnline(offlineSync.isOnline());
      setPendingActions(offlineSync.getPendingActions().length);
    };

    updateStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (isOnline && pendingActions === 0) {
    return null; // Don't show indicator when online with no pending actions
  }

  return (
    <Alert
      className={`fixed bottom-4 right-4 w-80 ${
        isOnline
          ? "bg-blue-50 border-blue-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-blue-600 mt-0.5" />
        ) : (
          <WifiOff className="h-4 w-4 text-amber-600 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p
              className={`font-semibold text-sm ${
                isOnline ? "text-blue-900" : "text-amber-900"
              }`}
            >
              {isOnline ? "Online" : "Offline Mode"}
            </p>
            {isSyncing && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            )}
          </div>
          <AlertDescription
            className={
              isOnline ? "text-blue-800 text-xs" : "text-amber-800 text-xs"
            }
          >
            {isOnline ? (
              <>
                {pendingActions > 0 ? (
                  <>
                    <span>{pendingActions} action(s) pending sync</span>
                    <br />
                    <span className="text-xs opacity-75">
                      Data will sync automatically
                    </span>
                  </>
                ) : (
                  "All data synced"
                )}
              </>
            ) : (
              <>
                <span>You are in offline mode</span>
                <br />
                <span className="text-xs opacity-75">
                  Changes will sync when connection is restored
                </span>
              </>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
