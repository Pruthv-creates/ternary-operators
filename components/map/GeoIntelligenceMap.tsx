"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useInvestigationStore } from "@/store/investigationStore";
import { cn } from "@/lib/utils";
import { RiskHeatmapLayer } from "./RiskHeatmapLayer";
import { MovementPathLayer } from "./MovementPathLayer";
import { TimelinePlayback } from "./TimelinePlayback";
import { GeoPatternPanel } from "./GeoPatternPanel";
import { toast } from "sonner";

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom markers for types
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const icons = {
  entity: createCustomIcon("#3b82f6"),    // blue
  event: createCustomIcon("#ef4444"),     // red
  evidence: createCustomIcon("#f59e0b"),  // yellow
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

function MapController({ hoveredNodeId }: { hoveredNodeId: string | null }) {
  const map = useMap();
  const { nodes } = useInvestigationStore();

  useEffect(() => {
    if (hoveredNodeId) {
      const node = nodes.find(n => n.id === hoveredNodeId);
      if (node?.data?.latitude && node.data?.longitude) {
        map.flyTo([node.data.latitude as number, node.data.longitude as number], 12, { animate: true, duration: 1.5 });
      }
    }
  }, [hoveredNodeId, nodes, map]);

  return null;
}

export default function GeoIntelligenceMap() {
  const { 
    nodes, 
    currentCaseId,
    activeMapNodeId, 
    setActiveMapNodeId, 
    setHighlightedGraphNodeId,
    refreshLocationEvents 
  } = useInvestigationStore();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  const [triggering, setTriggering] = useState(false);

  // Sync location data on mount or case change
  useEffect(() => {
    if (currentCaseId) {
      refreshLocationEvents();
    }
  }, [currentCaseId, refreshLocationEvents]);

  // Filter nodes with coordinates
  const geoNodes = useMemo(() => {
    return nodes.filter(n => n.data?.latitude && n.data?.longitude && !n.data?.isDeleted);
  }, [nodes]);

  const handleTriggerIntel = async () => {
    if (!currentCaseId) return;
    setTriggering(true);
    try {
      const res = await fetch(`/api/simulate-geo?caseId=${currentCaseId}`);
      const data = await res.json();
      if (data.success) {
        await refreshLocationEvents();
        toast.success("Intelligence simulation started successfully");
      } else {
        toast.error(data.error || "Failed to trigger intelligence.");
      }
    } catch (err) {
      console.error("Trigger error:", err);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[19.0760, 72.8777]} // Default to Mumbai center
        zoom={11}
        className="h-full w-full grayscale-[0.8] invert-[0.1]"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapResizer />
        <MapController hoveredNodeId={activeMapNodeId} />

        {/* Heatmap Layer */}
        {showHeatmap && <RiskHeatmapLayer nodes={geoNodes} />}

        {/* Movement Paths */}
        {showPaths && <MovementPathLayer />}

        {/* Markers */}
        {geoNodes.map((node) => {
          const type = node.type === "entity" ? "entity" : node.type === "event" ? "event" : "evidence";
          const icon = icons[type as keyof typeof icons] || icons.entity;
          const lat = node.data?.latitude as number;
          const lng = node.data?.longitude as number;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={node.id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  setHighlightedGraphNodeId(node.id);
                  setActiveMapNodeId(node.id);
                },
              }}
            >
              <Popup className="geo-popup">
                <div className="p-2 font-sans bg-[#0d1424] text-white border border-[#1e3a5f]/40 rounded-lg">
                  <h3 className="text-[11px] font-black uppercase tracking-wider mb-1 text-blue-400">
                    {(node.data?.name as string) || (node.data?.label as string)}
                  </h3>
                  <div className="space-y-1 text-[9px] font-mono text-slate-300">
                    <p><span className="text-slate-500 uppercase">Type:</span> {node.type}</p>
                    <p><span className="text-slate-500 uppercase">Risk:</span> {(node.data?.riskScore as number) || 0}%</p>
                    <p><span className="text-slate-500 uppercase">ID:</span> {node.id}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute right-6 top-6 z-[1000] flex flex-col gap-2 p-2 rounded-2xl bg-[#0a0f1c]/80 border border-[#1e3a5f]/40 backdrop-blur-md shadow-2xl">
        <button
          onClick={handleTriggerIntel}
          disabled={triggering}
          className={cn(
            "px-3 py-2 rounded-xl border font-mono text-[9px] font-black uppercase tracking-widest transition-all",
            triggering 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 cursor-not-allowed"
              : "border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          )}
        >
          {triggering ? "Reconstructing..." : "Trigger Real-time Intel"}
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={cn(
            "px-3 py-2 rounded-xl border font-mono text-[9px] font-black uppercase tracking-widest transition-all",
            showHeatmap ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-[#0d1424]/80 border-[#1e3a5f]/40 text-slate-500"
          )}
        >
          Heatmap: {showHeatmap ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => setShowPaths(!showPaths)}
          className={cn(
            "px-3 py-2 rounded-xl border font-mono text-[9px] font-black uppercase tracking-widest transition-all",
            showPaths ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-[#0d1424]/80 border-[#1e3a5f]/40 text-slate-500"
          )}
        >
          Paths: {showPaths ? "ON" : "OFF"}
        </button>
      </div>

      {/* Panels */}
      <GeoPatternPanel />
      <TimelinePlayback />
      
      <style jsx global>{`
        .leaflet-container {
          background: #0d1424 !important;
        }
        .geo-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .geo-popup .leaflet-popup-tip {
          background: #0d1424 !important;
        }
      `}</style>
    </div>
  );
}
