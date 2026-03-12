"use client";

import dynamic from "next/dynamic";
import { useInvestigationStore } from "@/store/investigationStore";
import { Map as MapIcon, Loader2, AlertTriangle } from "lucide-react";

// Dynamically import map component to avoid SSR issues with Leaflet
const GeoIntelligenceMap = dynamic(
  () => import("@/components/map/GeoIntelligenceMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#0d1424]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Initializing Geo-Enclave...
          </p>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  const { currentCaseId, currentCaseTitle } = useInvestigationStore();

  if (!currentCaseId) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#0d1424] p-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#1e3a5f]/30 bg-blue-500/5 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
          <AlertTriangle className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="mb-2 font-sans text-xl font-black uppercase tracking-tight text-white">
          No Active Enclave
        </h2>
        <p className="max-w-md font-sans text-sm text-slate-400">
          Geospatial intelligence requires an active investigation. Please select or create a case from the sidebar to initialize coordinates.
        </p>
      </div>
    );
  }

  return (
    <main className="relative flex h-full flex-col overflow-hidden bg-[#0a0f1a]">
      {/* Header Overlay */}
      <div className="absolute left-6 top-6 z-[1000] flex items-center gap-4">
        <div className="flex h-12 items-center gap-4 rounded-2xl border border-[#1e3a5f]/40 bg-[#0d1424]/80 px-5 backdrop-blur-xl shadow-2xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <MapIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-sans text-[11px] font-black uppercase tracking-[0.2em] text-white">
              Geo-Intelligence Enclave
            </h1>
            <p className="line-clamp-1 font-mono text-[9px] text-blue-400/80 uppercase tracking-wider">
              SIGINT-GEO: {currentCaseTitle || "Active Analysis"}
            </p>
          </div>
        </div>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-5 backdrop-blur-xl">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="font-mono text-[9px] font-black uppercase tracking-widest text-emerald-400">
            Secure Spatial Link Active
          </span>
        </div>
      </div>

      <div className="flex-1">
        <GeoIntelligenceMap />
      </div>
    </main>
  );
}
