import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusProps {
    status: "connected" | "connecting" | "disconnected";
    className?: string;
}

export function SyncStatus({ status, className }: SyncStatusProps) {
    const isConnected = status === "connected";
    
    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase transition-all duration-300 font-sans shadow-lg",
            isConnected 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-red-500/10 border-red-500/50 text-red-500 animate-pulse",
            className
        )}>
            {isConnected ? <Wifi size={12} className="text-emerald-400" /> : <WifiOff size={12} className="text-red-500" />}
            {isConnected ? "Sync Active" : "Link Severed"}
        </div>
    );
}
