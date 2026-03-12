"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapProps {
  nodes: any[];
}

export function RiskHeatmapLayer({ nodes }: HeatmapProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Prepare data: [lat, lng, intensity]
    // Intensity = riskScore / 100
    const heatData = nodes.map((node) => [
      node.data.latitude,
      node.data.longitude,
      (node.data.riskScore || 0) / 100
    ]);

    const layer = (L as any).heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: "yellow",
        0.65: "orange",
        1.0: "red"
      },
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, nodes]);

  return null;
}
