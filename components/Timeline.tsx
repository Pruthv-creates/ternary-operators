"use client";

import { cn } from "@/lib/utils";
import { TimelineEvent } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";
import { useRef, useState } from "react";

interface TimelineProps {
    events: TimelineEvent[];
}

const months = ["Jan 2023", "Mar", "Jul", "Sep", "Nov", "Dec 2023", "Jan 2024", "Mar", "Jul", "Sep", "Nov", "Dec 2024"];

export default function Timeline({ events }: TimelineProps) {
    const { addStickyNote, addEvidenceCard } = useInvestigationStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    
    // Sort events by date if possible
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/ai/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                // Add card to canvas after successful upload
                addEvidenceCard(file.name.toUpperCase(), { x: 700, y: 400 });
                alert(`Evidence successfully ingested: ${file.name}`);
            } else {
                alert("Upload failed. Ensure backend is running.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("An error occurred during upload.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

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
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Temporal Nexus View</div>
            </div>

            {/* Timeline base track */}
            <div className="relative w-full h-16 pointer-events-auto">
                {/* Horizontal line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                <div className="absolute top-1/2 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent blur-sm" />

                {/* Event Markers */}
                <div className="relative w-full h-full flex items-center justify-between px-8">
                    {sortedEvents.map((event, i) => (
                        <div key={event.id} className="relative group flex flex-col items-center">
                            {/* Floating Label */}
                            <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none z-20">
                                <div className="bg-[#0f172a] border border-cyan-500/30 rounded-lg p-2 shadow-2xl backdrop-blur-xl min-w-[120px]">
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
                            <div className="absolute top-full mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                {event.date}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex justify-center gap-3 py-2 pointer-events-auto">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="group flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0d1424]/80 border border-slate-700/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all disabled:opacity-50"
                >
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20">
                        {uploading ? (
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent animate-spin rounded-full" />
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                        )}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-200">
                        {uploading ? "Ingesting..." : "Add Evidence"}
                    </span>
                </button>
                <button 
                    onClick={() => addStickyNote({ x: 100, y: 600 }, "Investigate money laundering link...")}
                    className="group flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-amber-950 font-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-900/20"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Hypothesis</span>
                </button>
            </div>
        </div>
    );
}
