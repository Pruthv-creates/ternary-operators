"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { useInvestigationStore } from "@/store/investigationStore";

interface HeatmapProps {
  nodes: any[];
}

export function RiskHeatmapLayer({ nodes }: HeatmapProps) {
  const map = useMap();
  const { locationEvents, playbackTime, isPlaybackPlaying } = useInvestigationStore();

  useEffect(() => {
    if (!map) return;

    // Filter location events up to the current playback time
    const visibleEvents = locationEvents.filter((e) => {
      const time = new Date(e.timestamp).getTime();
      return !isPlaybackPlaying || time <= playbackTime;
    });

    // Heat data from base nodes
    const baseHeat = nodes
      .filter((n) => n.data?.latitude && n.data?.longitude)
      .map((node) => [
        node.data.latitude,
        node.data.longitude,
        (node.data.riskScore || 0) / 100,
      ]);

    // Heat data from movement events (increasing the "hotspot" radius over time)
    const eventHeat = visibleEvents.map((evt) => {
      const parentNode = nodes.find((n) => n.id === evt.entityId);
      const intensity = parentNode?.data?.riskScore 
        ? parentNode.data.riskScore / 100 
        : 0.8;
      return [evt.latitude, evt.longitude, intensity]; // slightly lower intensity for events to show trail
    });

    const heatData = [...baseHeat, ...eventHeat];

    const layer = (L as any).heatLayer(heatData, {
      radius: 35, // Increased radius for better sphere of influence
      blur: 20,
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
  }, [map, nodes, locationEvents, playbackTime, isPlaybackPlaying]);

  return null;
}
