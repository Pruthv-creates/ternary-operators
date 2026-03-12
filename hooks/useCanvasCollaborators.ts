import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useInvestigationStore } from "@/store/investigationStore";

const CURSOR_THROTTLE_MS = 40;
const CURSOR_TIMEOUT_MS = 5000;

export function useCanvasCollaborators(canvasRef: React.RefObject<HTMLDivElement>) {
    const { collaborators, broadcastCursor } = useInvestigationStore();
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string; color: string } | null>(null);
    const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
                const color = colors[Math.abs(data.user.id.charCodeAt(0)) % colors.length];
                setCurrentUser({
                    id: data.user.id,
                    name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Analyst",
                    color,
                });
            }
        });
    }, []);

    // Heartbeat: evict collaborators who haven't sent a cursor update
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const { collaborators: current } = useInvestigationStore.getState();
            const pruned = Object.fromEntries(
                Object.entries(current).filter(([, u]) => now - u.lastSeen < CURSOR_TIMEOUT_MS)
            );
            if (Object.keys(pruned).length !== Object.keys(current).length) {
                useInvestigationStore.setState({ collaborators: pruned });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!currentUser || !canvasRef.current) return;
        if (cursorThrottleRef.current) return;

        cursorThrottleRef.current = setTimeout(() => {
            cursorThrottleRef.current = null;
        }, CURSOR_THROTTLE_MS);

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        broadcastCursor(currentUser.id, currentUser.name, currentUser.color, x, y);
    }, [currentUser, broadcastCursor, canvasRef]);

    return {
        currentUser,
        collaborators,
        handleMouseMove,
        CURSOR_THROTTLE_MS
    };
}
