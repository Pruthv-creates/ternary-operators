"use client";

import { useEffect, useMemo } from "react";
import { useInvestigationStore } from "@/store/investigationStore";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

export function TimelinePlayback() {
  const { 
    locationEvents, 
    playbackTime, 
    setPlaybackTime, 
    isPlaybackPlaying, 
    setIsPlaybackPlaying 
  } = useInvestigationStore();

  const { min, max } = useMemo(() => {
    if (locationEvents.length === 0) return { min: 0, max: 100 };
    const times = locationEvents.map(e => new Date(e.timestamp).getTime());
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [locationEvents]);

  useEffect(() => {
    if (isPlaybackPlaying && locationEvents.length > 0) {
      if (playbackTime < min) setPlaybackTime(min);
      
      const interval = setInterval(() => {
        setPlaybackTime((prev: number) => {
          const next = prev + (max - min) / 100; // Increment 1% every step
          if (next >= max) {
            setIsPlaybackPlaying(false);
            return max;
          }
          return next;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlaybackPlaying, min, max, setPlaybackTime, setIsPlaybackPlaying, locationEvents.length]);

  if (locationEvents.length === 0) return null;

  return (
    <div className="absolute bottom-10 left-1/2 z-[1000] -translate-x-1/2 w-[600px]">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#1e3a5f]/40 bg-[#0d1424]/90 p-5 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaybackPlaying(!isPlaybackPlaying)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-transform active:scale-95"
            >
              {isPlaybackPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
            </button>
            <button
              onClick={() => setPlaybackTime(min)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1e3a5f]/40 bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <input
              type="range"
              min={min}
              max={max}
              value={playbackTime}
              onChange={(e) => setPlaybackTime(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-blue-900/30 accent-blue-500 transition-all hover:bg-blue-900/50"
            />
            <div className="flex justify-between font-mono text-[9px] font-black uppercase tracking-widest text-slate-500">
              <span>{new Date(min).toLocaleDateString()}</span>
              <span className="text-blue-400">{new Date(playbackTime).toLocaleString()}</span>
              <span>{new Date(max).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex h-12 items-center gap-3 rounded-2xl bg-white/5 px-4 border border-white/5">
            <Clock size={14} className="text-blue-400" />
            <span className="font-mono text-[10px] font-bold text-white uppercase tracking-tighter">Playback Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
