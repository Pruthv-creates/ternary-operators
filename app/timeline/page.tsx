"use client";

import { 
    Filter, 
    ArrowUpRight, 
    Zap, 
    BarChart3,
    Database,
    ChevronDown,
    Plus,
    History
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// --- Mock Data ---
const rawEvents = [
    { id: 1, date: "2023-07-12", title: "Travel: LHR to LCA (A. Volkov)", type: "Travel", category: "Location", status: "Staged", confidence: 94 },
    { id: 2, date: "2023-07-15", title: "Swift Transfer: $12.5M to Shell Co.", type: "Financial", category: "Bank", status: "Conflict", confidence: 82 },
    { id: 3, date: "2023-08-01", title: "Travel: LHR to DXB (A. Volkov)", type: "Travel", category: "Location", status: "Staged", confidence: 91 },
    { id: 4, date: "2023-09-12", title: "Call Log: AV to Syndicate Contact", type: "Comm", category: "Intel", status: "Draft", confidence: 65 },
];

export default function TimelinePage() {
    const [selectedEvent, setSelectedEvent] = useState(rawEvents[0]);

    return (
        <>
        <main className="flex-1 overflow-hidden p-6 flex flex-col gap-6 relative z-10">
                    
                    {/* Header Controls */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-black text-white tracking-tight">Timeline Engine</h1>
                                <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] font-black text-blue-400 uppercase tracking-widest">Staging Environment</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium tracking-wide italic">Managing 1,242 raw temporal data points across 12 ingestion streams.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#0d1424] border border-[#1e3a5f]/40 rounded-xl">
                                <Filter size={14} className="text-slate-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Stream</span>
                                <ChevronDown size={14} className="text-slate-600" />
                            </div>
                            <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black text-white transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest flex items-center gap-2">
                                <Plus size={16} />
                                New Manual Entry
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex gap-6 min-h-0">
                        
                        {/* Left: Global Timeline Visualization (High Dense) */}
                        <div className="flex-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm">
                            <div className="px-6 py-4 border-b border-[#1e3a5f]/40 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BarChart3 size={16} className="text-blue-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Temporal Density Heatmap</h3>
                                </div>
                                <div className="flex gap-4">
                                    {["2023", "2024", "2025"].map(year => (
                                        <span key={year} className="text-[10px] font-black text-slate-600 hover:text-blue-400 cursor-pointer transition-colors uppercase">{year}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 relative flex flex-col items-center justify-center p-8">
                                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(90deg,#1e3a5f_1px,transparent_1px),linear-gradient(#1e3a5f_1px,transparent_1px)] [background-size:32px_32px]" />
                                
                                {/* Dense Timeline Track */}
                                <div className="w-full h-24 relative flex items-center">
                                    <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e3a5f] to-transparent" />
                                    <div className="w-full flex justify-between absolute px-10">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2">
                                                <div className={cn(
                                                    "w-1 rounded-full",
                                                    i % 3 === 0 ? "h-6 bg-blue-500/50" : "h-3 bg-slate-800"
                                                )} />
                                                <span className="text-[8px] font-bold text-slate-700 uppercase">{["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][i]}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Data Clusters */}
                                    <div className="absolute left-[20%] w-32 h-12 bg-blue-500/5 border border-blue-500/20 rounded-full blur-[2px] flex items-center justify-center">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                    </div>
                                    <div className="absolute left-[65%] w-16 h-8 bg-red-500/5 border border-red-500/20 rounded-full blur-[1px] flex items-center justify-center">
                                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                                    </div>
                                </div>

                                <div className="mt-8 text-center max-w-sm">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Editor status</div>
                                    <p className="text-[11px] text-slate-600 font-medium italic italic">Zoomed to Q3 2023. Selected region contains 88 staged travel events and 12 un-reconciled bank transfers.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Event Queue & Promotion */}
                        <div className="w-[450px] flex flex-col gap-6">
                            
                            {/* Staging Queue */}
                            <div className="flex-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm">
                                <div className="px-6 py-4 border-b border-[#1e3a5f]/40 bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <Database size={16} className="text-blue-400" />
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Promotion Queue</h3>
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                    {rawEvents.map(event => (
                                        <div 
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                                                selectedEvent.id === event.id 
                                                    ? "bg-blue-500/10 border-blue-500/40" 
                                                    : "border-transparent hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{event.date}</span>
                                                <div className={cn(
                                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                    event.status === "Staged" ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                                                )}>{event.status}</div>
                                            </div>
                                            <div className="text-[12px] font-bold text-slate-200 mb-1 group-hover:text-blue-400 transition-colors">{event.title}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase">{event.type} Intel</span>
                                                <span className="text-[9px] text-slate-700">•</span>
                                                <span className="text-[9px] font-bold text-slate-600 uppercase">Confidence: {event.confidence}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Promotion Active Control */}
                                <div className="p-6 bg-blue-500/5 border-t border-[#1e3a5f]/40">
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="w-10 h-10 rounded-xl bg-[#0a0f1c] border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-white uppercase tracking-widest mb-1">Promote to Analytics</div>
                                            <p className="text-[10px] text-slate-500 leading-tight">Publish selected events to the case timeline and auto-link related map entities.</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 uppercase tracking-[0.2em]">
                                        Commit 12 Events
                                        <ArrowUpRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Stats/Status */}
                            <div className="h-20 bg-[#0d1424] border border-[#1e3a5f]/40 rounded-2xl px-6 flex items-center gap-4">
                                <History size={18} className="text-slate-600" />
                                <div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Intel Refresh</div>
                                    <div className="text-xs font-bold text-slate-300">Synchronized 12m 42s ago</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 10px; }
            `}</style>
        </>
    );
}
