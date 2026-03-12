"use client";

import { cn } from "@/lib/utils";
import { TimelineEvent } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";

interface TimelineProps {
    events: TimelineEvent[];
}

const months = ["Jan 2023", "Mar", "Jul", "Sep", "Nov", "Dec 2023", "Jan 2024", "Mar", "Jul", "Sep", "Nov", "Dec 2024"];

export default function Timeline(_props: TimelineProps) {
    const { addStickyNote, addEvidenceCard } = useInvestigationStore();
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-4/5 max-w-5xl h-32 flex flex-col justify-end z-10 pointers-event-none">
            {/* Timeline base track */}
            <div className="relative w-full flex items-center mb-6">
                {/* Horizontal line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-600/50 via-cyan-500/80 to-cyan-800/20" />

                {/* Markers & Labels matching Image 1 */}
                <div className="relative w-full flex justify-between items-center pointer-events-auto">
                    {months.map((month, i) => {
                        const eventAtThisPoint = [
                            { idx: 2, label: "AV APPOINTED CEO", type: "info" },
                            { idx: 5, label: "SYNERGY IPO", type: "info" },
                            { idx: 8, label: "SUSPICIOUS TRANSFER", type: "alert" }
                        ].find(e => e.idx === i);

                        return (
                            <div key={i} className="flex flex-col items-center relative -mt-3">
                                {/* Event Label Floating Above */}
                                {eventAtThisPoint && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mb-2 w-max">
                                        <div className="px-3 py-1.5 rounded-md bg-[#1e293b]/90 border border-slate-700/60 shadow-lg backdrop-blur-md">
                                            <span className="text-[10px] font-bold tracking-wide text-slate-300 whitespace-nowrap">
                                                {eventAtThisPoint.label}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Arrow down from label to dot */}
                                {eventAtThisPoint && (
                                    <div className="absolute bottom-[22px] left-1/2 -translate-x-1/2 w-px h-6 bg-slate-600/50" />
                                )}

                                {/* Dot on timeline */}
                                {month === "Jan 2023" || month === "Nov" || month === "Sep" ? (
                                    // Small simple tick dot
                                    <div className="w-[5px] h-[5px] rounded-full bg-cyan-700 mt-2.5 z-10" />
                                ) : eventAtThisPoint ? (
                                    // Highlighted dot
                                    <div className={cn(
                                        "w-[14px] h-[14px] rounded-full flex items-center justify-center -mt-px z-10 shadow-[0_0_12px_rgba(6,182,212,0.6)] border-2 border-[#0a0f1c]",
                                        eventAtThisPoint.type === "alert" ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" : "bg-cyan-500"
                                    )}>
                                        <div className="w-[6px] h-[6px] rounded-full bg-white" />
                                    </div>
                                ) : (
                                    // Empty dot
                                    <div className="w-2 h-2 rounded-full border border-cyan-700 bg-[#0a0f1c] mt-1.5 z-10" />
                                )}

                                {/* Text label below timeline */}
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-sans tracking-wide whitespace-nowrap">
                                    {month}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex justify-center gap-4 pointer-events-auto">
                <button 
                    onClick={() => addEvidenceCard("NEW EVIDENCE", { x: 800, y: 300 })}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-400 font-bold transition-all shadow-lg shadow-blue-900/10"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    <span className="text-[11px] uppercase tracking-wider">Add Evidence</span>
                </button>
                <button 
                    onClick={() => addStickyNote({ x: 100, y: 600 }, "Investigate money laundering link...")}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500 text-amber-950 font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-900/20"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
                    <span className="text-[11px] uppercase tracking-wider">Add Hypothesis</span>
                </button>
            </div>
        </div>
    );
}
