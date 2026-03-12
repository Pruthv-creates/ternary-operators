"use client";

import { cn } from "@/lib/utils";
import { TimelineEvent } from "@/lib/data";
import { useTimelineLogic } from "@/hooks/useTimelineLogic";
import { TimelineMarker } from "@/components/timeline/TimelineMarker";
import { TimelineActions } from "@/components/timeline/TimelineActions";

interface TimelineProps {
    events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
    const { 
        fileInputRef, 
        uploading, 
        handleFileUpload, 
        handleAddHypothesis 
    } = useTimelineLogic();
    
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl flex flex-col gap-6 z-10 pointer-events-none">
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
                accept=".txt"
            />

            {/* Legend / Info */}
            <div className="flex justify-between items-center px-4">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Milestone</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alert</span>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] font-sans">Temporal Nexus View</div>
            </div>

            {/* Timeline base track */}
            <div className="relative w-full h-16 pointer-events-auto">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                <div className="absolute top-1/2 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent blur-sm" />

                <div className="relative w-full h-full flex items-center justify-between px-8">
                    {sortedEvents.map((event) => (
                        <TimelineMarker key={event.id} event={event} />
                    ))}
                </div>
            </div>

            {/* Bottom Action Bar */}
            <TimelineActions 
                onUploadClick={() => fileInputRef.current?.click()}
                onAddHypothesis={handleAddHypothesis}
                uploading={uploading}
            />
        </div>
    );
}
