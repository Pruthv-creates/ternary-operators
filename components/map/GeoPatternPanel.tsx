"use client";

import { useMemo } from "react";
import { useInvestigationStore } from "@/store/investigationStore";
import { Zap, MapPin, Eye, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GeoPatternPanel() {
  const { nodes, locationEvents } = useInvestigationStore();

  const patterns = useMemo(() => {
    const findings: any[] = [];
    
    // 1. Shared Location Pattern
    const cityCounts: Record<string, Set<string>> = {};
    nodes.forEach(n => {
      const city = n.data?.location as string;
      if (city) {
        if (!cityCounts[city]) cityCounts[city] = new Set();
        cityCounts[city].add((n.data?.name as string) || (n.data?.label as string));
      }
    });

    Object.entries(cityCounts).forEach(([city, entities]) => {
      if (entities.size > 1) {
        findings.push({
          pattern: "Spatial Convergence",
          description: `Multiple entities detected in ${city}.`,
          entities: Array.from(entities),
          location: city,
          severity: "Medium",
          type: "shared"
        });
      }
    });

    // 2. High Risk Proximity
    const highRiskInZone = nodes.filter(n => ((n.data?.riskScore as number) || 0) > 80 && n.data?.latitude);
    if (highRiskInZone.length > 2) {
      findings.push({
        pattern: "Risk Hotspot",
        description: `${highRiskInZone.length} high-risk entities operating in close proximity.`,
        entities: highRiskInZone.map(n => n.data.name),
        severity: "High",
        type: "hotspot"
      });
    }

    return findings;
  }, [nodes]);

  if (patterns.length === 0) return null;

  return (
    <div className="absolute left-6 bottom-32 z-[1000] w-80 space-y-3">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Zap size={14} className="text-yellow-400 fill-yellow-400 animate-pulse" />
        <h2 className="font-sans text-[11px] font-black uppercase tracking-[0.2em] text-white">
          Spatial Intelligence Insights
        </h2>
      </div>

      <AnimatePresence>
        {patterns.map((p, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-[#1e3a5f]/40 bg-[#0d1424]/80 p-4 backdrop-blur-xl transition-all hover:bg-[#0d1424]"
          >
            {/* Severity Accent */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              p.severity === "High" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-yellow-500"
            }`} />

            <div className="flex items-start justify-between mb-2">
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                p.severity === "High" ? "text-red-400" : "text-yellow-400"
              }`}>
                {p.pattern}
              </span>
              <Info size={12} className="text-slate-500" />
            </div>

            <p className="text-[10px] text-slate-300 mb-3 leading-relaxed">
              {p.description}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {p.entities.map((name: string, j: number) => (
                <span key={j} className="text-[8px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-blue-400 border border-white/5">
                  @{name}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex items-center justify-center p-2 rounded-xl border border-white/5 bg-white/5">
          <p className="font-mono text-[8px] text-slate-500 uppercase tracking-widest italic">
            Computed by Geo-Pattern Engine v2.4
          </p>
      </div>
    </div>
  );
}
