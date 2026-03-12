import { useState, useEffect } from "react";
import { realtimeSyncManager } from "@/lib/realtimeSync";

export function useSyncStatus() {
    const [status, setStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");

    useEffect(() => {
        const interval = setInterval(() => {
            // @ts-ignore
            const isSubbed = realtimeSyncManager.channel?.state === 'joined';
            setStatus(isSubbed ? "connected" : "disconnected");
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return status;
}
