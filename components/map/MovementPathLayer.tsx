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
                  radius={isLast ? 7 : 4}
                  pathOptions={{ 
                    fillColor: isLast ? "#3b82f6" : "#60a5fa", 
                    fillOpacity: isLast ? 0.9 : 0.4, 
                    color: "white", 
                    weight: isLast ? 2 : 1 
                  }}
                >
                  <Popup className="geo-popup">
                     <div className="p-4 font-sans bg-[#0d1424] text-white border border-[#1e3a5f]/60 rounded-2xl w-[260px] shadow-2xl backdrop-blur-xl">
                       <div className="flex items-center justify-between mb-3">
                          <h3 className="text-[12px] font-black uppercase tracking-wider text-blue-400">
                            {label}
                          </h3>
                          {isLast && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30 animate-pulse">
                              LIVE
                            </span>
                          )}
                       </div>
                       
                       <div className="space-y-3 text-[10px] font-mono text-slate-300">
                         <div className="flex items-center justify-between text-slate-500 border-b border-white/5 pb-2">
                            <span>TIMESTAMP:</span>
                            <span className="text-slate-200">{new Date(evt.timestamp).toLocaleString()}</span>
                         </div>
                         
                         <div className="pt-1">
                            <span className="text-slate-500 uppercase font-black block mb-2 tracking-widest text-[8px]">Subject Behavior / Conjecture:</span>
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-emerald-400/90 leading-relaxed">
                              {reason}
                            </div>
                         </div>

                         <div className="flex items-center gap-2 pt-1">
                             <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                             <span className="text-slate-500 uppercase font-black tracking-widest text-[8px]">Coordinates: {evt.latitude.toFixed(4)}, {evt.longitude.toFixed(4)}</span>
                         </div>
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
