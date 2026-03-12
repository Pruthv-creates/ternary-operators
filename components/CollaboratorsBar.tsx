"use client";

import { useInvestigationStore } from "@/store/investigationStore";
import { Users, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { realtimeSyncManager } from "@/lib/realtimeSync";

export default function CollaboratorsBar() {
  const { collaborators, currentCaseId } = useInvestigationStore();
  const [status, setStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");

  useEffect(() => {
    // Poll for status or listen to events if we had them
    const interval = setInterval(() => {
      // @ts-ignore
      const isSubbed = realtimeSyncManager.channel?.state === 'joined';
      setStatus(isSubbed ? "connected" : "disconnected");
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const collaboratorList = Object.values(collaborators);

  if (!currentCaseId) return null;

  return (
    <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
      {/* Connection Status */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-widest uppercase transition-all duration-300",
        status === "connected" 
          ? "bg-green-500/10 border-green-500/30 text-green-400" 
          : "bg-red-500/10 border-red-500/30 text-red-400 border-red-500/50 animate-pulse"
      )}>
        {status === "connected" ? <Wifi size={12} /> : <WifiOff size={12} />}
        {status === "connected" ? "Sync Active" : "Sync Offline"}
      </div>

      {/* Collaborator Avatars */}
      <div className="flex -space-x-2 overflow-hidden">
        {collaboratorList.map((user) => (
          <div
            key={user.userId}
            title={user.name}
            className="inline-block h-8 w-8 rounded-full ring-2 ring-[#0a0f1c] bg-[#1e293b] flex items-center justify-center text-[10px] font-bold text-white border transition-transform hover:scale-110 hover:z-10"
            style={{ 
              borderColor: user.color,
              backgroundColor: `${user.color}20`,
              color: user.color 
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {collaboratorList.length === 0 && (
          <div className="h-8 w-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600" title="No other investigators">
            <Users size={14} />
          </div>
        )}
      </div>
    </div>
  );
}
