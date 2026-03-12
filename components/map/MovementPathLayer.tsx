"use client";

import { useMemo } from "react";
import { Polyline, CircleMarker } from "react-leaflet";
import { useInvestigationStore } from "@/store/investigationStore";

export function MovementPathLayer() {
  const { locationEvents, playbackTime, isPlaybackPlaying } = useInvestigationStore();

  // Group events by entity
  const entityPaths = useMemo(() => {
    const paths: Record<string, any[]> = {};
    locationEvents.forEach((event) => {
      if (!paths[event.entityId]) paths[event.entityId] = [];
      paths[event.entityId].push(event);
    });
    
    // Sort each path by timestamp
    Object.keys(paths).forEach((id) => {
      paths[id].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
    
    return paths;
  }, [locationEvents]);

  return (
    <>
      {Object.entries(entityPaths).map(([entityId, events]) => {
        // Filter events by playbackTime if playback is active
        const visibleEvents = events.filter(e => {
            const time = new Date(e.timestamp).getTime();
            return !isPlaybackPlaying || time <= playbackTime;
        });

        if (visibleEvents.length < 1) return null;

        const positions = visibleEvents.map(e => [e.latitude, e.longitude] as [number, number]);
        const lastEvent = visibleEvents[visibleEvents.length - 1];

        return (
          <div key={entityId}>
            <Polyline
              positions={positions}
              pathOptions={{ 
                color: "#60a5fa", 
                weight: 2, 
                dashArray: "5, 10",
                opacity: 0.6 
              }}
            />
            {/* Current entity position during playback */}
            <CircleMarker
              center={[lastEvent.latitude, lastEvent.longitude]}
              radius={6}
              pathOptions={{ 
                fillColor: "#3b82f6", 
                fillOpacity: 0.8, 
                color: "white", 
                weight: 2 
              }}
            />
          </div>
        );
      })}
    </>
  );
}
