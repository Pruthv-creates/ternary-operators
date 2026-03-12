"use client";

import { useEffect, useRef } from "react";
import { SyncEvent } from "@/lib/realtimeSync";
import { useActivityFeed } from "@/hooks/activity/useActivityFeed";
import { ActivityItem } from "@/components/activity/ActivityItem";

interface ActivityFeedProps {
    onEvent?: (event: SyncEvent) => void;
}

export const ActivityFeed = ({ onEvent }: ActivityFeedProps) => {
    const { activities, addActivity } = useActivityFeed();
    const onEventRef = useRef(onEvent);

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    // This component acts as a sink for events. 
    // In a real scenario, this might subscribe to a store or global emitter.
    // For now, we manually handle the incoming event via the ref if called externally,
    // but the original architecture seems to rely on the parent passing events down.
    
    // To maintain compatibility with existing InvestigationCanvas usage:
    // We'll expose a method or rely on the parent calling a prop.
    // Wait, the original code used a ref within the component but didn't export it.
    // The parent likely passed `onEvent` which this component then "handled".
    
    return (
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
            {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale font-sans">
                    <div className="w-10 h-10 rounded-full border border-dashed border-slate-500 mb-2 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-slate-500 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Awaiting Signals</p>
                </div>
            ) : (
                activities.map((activity) => (
                    <ActivityItem
                        key={`${activity.id}-${activity.timestamp.getTime()}`}
                        message={activity.message}
                        timestamp={activity.timestamp}
                        Icon={activity.Icon}
                        iconColor={activity.iconColor}
                    />
                ))
            )}
        </div>
    );
};
