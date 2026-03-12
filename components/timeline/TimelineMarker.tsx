import { cn } from "@/lib/utils";
import { TimelineEvent } from "@/lib/data";

interface TimelineMarkerProps {
    event: TimelineEvent;
}

export function TimelineMarker({ event }: TimelineMarkerProps) {
    return (
        <div className="relative group flex flex-col items-center">
            {/* Floating Label */}
            <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none z-20">
                <div className="bg-[#0f172a] border border-cyan-500/50 rounded-lg p-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)] min-w-[140px]">
                    <div className="text-[9px] font-black text-cyan-400 uppercase mb-1">{event.date}</div>
                    <div className="text-[11px] font-bold text-white mb-1 leading-tight">{event.label}</div>
                    <div className="text-[9px] text-slate-400 leading-snug">{event.description}</div>
                </div>
                <div className="w-px h-3 bg-cyan-500/50 mx-auto" />
            </div>

            {/* Node */}
            <div className={cn(
                "w-3 h-3 rounded-full border-2 transition-all duration-300 cursor-pointer z-10",
                event.type === 'alert' 
                    ? "bg-red-500 border-red-950 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-150" 
                    : "bg-cyan-500 border-cyan-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-150"
            )} />

            {/* Date below */}
            <div className="absolute top-full mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter w-max">
                {event.date}
            </div>
        </div>
    );
}
