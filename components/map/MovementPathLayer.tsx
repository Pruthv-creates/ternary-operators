"use client";

import { useMemo } from "react";
import { Polyline, CircleMarker, Popup } from "react-leaflet";
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
        const visibleEvents = events.filter(e => {
            const time = new Date(e.timestamp).getTime();
            return time <= playbackTime;
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
            {/* All historic and current events as clickable points */}
            {visibleEvents.map((evt, idx) => {
              const isLast = idx === visibleEvents.length - 1;
              const label = evt.node?.label || "Unknown Entity";
              const reason = evt.source || "Unknown Activity";

              return (
                <CircleMarker
                  key={evt.id}
                  center={[evt.latitude, evt.longitude]}
                  radius={isLast ? 6 : 4}
                  pathOptions={{ 
                    fillColor: isLast ? "#3b82f6" : "#60a5fa", 
                    fillOpacity: isLast ? 0.8 : 0.4, 
                    color: "white", 
                    weight: isLast ? 2 : 1 
                  }}
                >
                  <Popup className="geo-popup">
                     <div className="p-3 font-sans bg-[#0d1424] text-white border border-[#1e3a5f]/40 rounded-xl w-[220px]">
                       <h3 className="text-[12px] font-black uppercase tracking-wider mb-2 text-blue-400">
                         {label}
                       </h3>
                       <div className="space-y-2 text-[10px] font-mono text-slate-300">
                         <p className="text-slate-400 border-b border-slate-700/50 pb-2">{new Date(evt.timestamp).toLocaleString()}</p>
                         <p className="pt-1"><span className="text-slate-500 uppercase font-bold block mb-1">Conjecture / Activity:</span> <span className="text-emerald-400">{reason}</span></p>
                       </div>
                     </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
