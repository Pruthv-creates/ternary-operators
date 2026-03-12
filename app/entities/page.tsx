"use client";


import { 
    Users, 
    Search, 
    Filter, 
    CheckCircle2, 
    ArrowUpRight,
    ShieldCheck,
    Database,
    History,
    MoreVertical,
    ChevronRight,
    Brain,
    Info
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// --- Mock Data ---
const pendingEntities = [
    { id: 1, name: "Synergy Corp", type: "Company", risk: 74, status: "Conflicted", confidence: 68 },
    { id: 2, name: "Alexander Volkov", type: "Person", risk: 87, status: "Unconfirmed", confidence: 92 },
    { id: 3, name: "Nicosia Holdings", type: "Offshore", risk: 95, status: "Draft", confidence: 45 },
    { id: 4, name: "Elena Petrova", type: "Person", risk: 48, status: "Validated", confidence: 98 },
];

import { useInvestigationStore } from "@/store/investigationStore";
import { useAI } from "@/hooks/useAI";
import AIAssistant from "@/components/AIAssistant";
import { aiActions } from "@/lib/data";

export default function EntitiesPage() {
    const { aiPanelOpen, setAIPanelOpen } = useInvestigationStore();
    const { askAI } = useAI();
    const [selectedEntity, setSelectedEntity] = useState(pendingEntities[0]);

    return (
        <>
        <main className="flex-1 overflow-hidden p-6 gap-6 flex relative z-10">
                    
                    {/* Left: Entity List & Search */}
                    <div className="w-80 flex flex-col gap-4">
                        <div className="bg-[#0d1424] border border-[#1e3a5f]/40 rounded-2xl p-4">
                            <div className="relative mb-4">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search unconfirmed..."
                                    className="w-full pl-9 pr-4 py-2 bg-[#0a0f1c] border border-[#1e3a5f]/40 rounded-xl text-xs text-slate-300 focus:border-blue-500/50 transition-all outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                                <span>Entity Stage (12)</span>
                                <Filter size={12} className="cursor-pointer hover:text-blue-400" />
                            </div>
                        </div>

                        <div className="flex-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-2xl overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {pendingEntities.map(entity => (
                                <button
                                    key={entity.id}
                                    onClick={() => setSelectedEntity(entity)}
                                    className={cn(
                                        "w-full p-3 rounded-xl border flex items-center justify-between transition-all group group text-left",
                                        selectedEntity.id === entity.id 
                                            ? "bg-blue-500/10 border-blue-500/40" 
                                            : "border-transparent hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center border",
                                            entity.risk > 80 ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                        )}>
                                            <Users size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-200 truncate">{entity.name}</div>
                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{entity.type} • {entity.risk}% Risk</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={12} className={cn("text-slate-600", selectedEntity.id === entity.id && "text-blue-400")} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Entity Workbench */}
                    <div className="flex-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm">
                        
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-[#1e3a5f]/40 bg-gradient-to-r from-blue-500/5 to-transparent flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-[#0a0f1c] border border-[#1e3a5f]/60 flex items-center justify-center relative">
                                    <Users size={32} className="text-blue-400" />
                                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-blue-500 text-[8px] font-black text-white uppercase tracking-widest">Stage 2</div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-black text-white tracking-tight">{selectedEntity.name}</h2>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-[0.1em]",
                                            selectedEntity.status === "Conflicted" ? "text-amber-400 border-amber-500/30 bg-amber-500/5" : "text-blue-400 border-blue-500/30 bg-blue-500/5"
                                        )}>{selectedEntity.status}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5"><Database size={12} /> 12 Source Signals</div>
                                        <div className="flex items-center gap-1.5"><History size={12} /> Last Mod 2h ago</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-black text-white transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 uppercase tracking-widest">
                                    Promote to Canvas
                                    <ArrowUpRight size={14} />
                                </button>
                                <button className="p-2 rounded-xl border border-[#1e3a5f]/60 text-slate-500 hover:text-slate-300 transition-all">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Workbench Columns */}
                        <div className="flex-1 flex min-h-0">
                            {/* Conflicted Data & Profiling */}
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
                                
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-emerald-500" />
                                        Data Integrity Check
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 rounded-2xl bg-[#0a0f1c] border border-red-500/20 relative group">
                                            <div className="text-[9px] font-black text-red-500 uppercase mb-2">Version A: Commercial Log</div>
                                            <div className="text-sm font-bold text-slate-200 mb-1">Beneficial Owner: A. Volkov</div>
                                            <div className="text-xs text-slate-500 mb-3">Address: 42 Marina Bay, Limassol</div>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                                                <span className="text-[9px] font-bold text-slate-600 uppercase">Credibility: 88%</span>
                                                <button className="text-[9px] font-black text-blue-400 uppercase hover:underline">Accept version</button>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-[#0a0f1c] border border-blue-500/20 relative group">
                                            <div className="text-[9px] font-black text-blue-500 uppercase mb-2">Version B: Interpol Bulletin</div>
                                            <div className="text-sm font-bold text-slate-200 mb-1">Beneficial Owner: Alexander Volkov</div>
                                            <div className="text-xs text-slate-500 mb-3">Address: 121 Regent St, London</div>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                                                <span className="text-[9px] font-bold text-slate-600 uppercase">Credibility: 96%</span>
                                                <button className="text-[9px] font-black text-blue-400 uppercase hover:underline">Accept version</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Extended Profile Staging</h3>
                                    <div className="bg-white/[0.02] rounded-2xl border border-[#1e3a5f]/20 p-6 grid grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-bold text-slate-600 uppercase">Vat Number</div>
                                            <div className="text-xs text-slate-300 font-mono">CY-482910394</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-bold text-slate-600 uppercase">Reg Date</div>
                                            <div className="text-xs text-slate-300">2022-04-15</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-bold text-slate-600 uppercase">Parent Entity</div>
                                            <div className="text-xs text-blue-400 font-bold cursor-pointer hover:underline uppercase tracking-tighter">Nicosia Holdings</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Entity Actions & Context (Right Panel) */}
                            <div className="w-80 border-l border-[#1e3a5f]/30 p-8 flex flex-col gap-6 bg-white/[0.01]">
                                <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Brain size={16} className="text-blue-400" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Astra Entity Logic</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                        &quot;Detected high-overlap between Version B and the Shell_Co_Registration.pdf. Suggest merging and tagging as &apos;High Significance&apos;.&quot;
                                    </p>
                                    <button className="mt-4 w-full py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all">
                                        Execute AI Merge
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Promotion Checklist</div>
                                    <div className="space-y-2">
                                        {[
                                            { label: "Resolve Address Conflict", done: false },
                                            { label: "Validate Ownership Tie", done: true },
                                            { label: "Link Financial Evidence", done: true },
                                            { label: "Assign Risk Weighting", done: true }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                {item.done ? <CheckCircle2 size={14} className="text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded border border-slate-700" />}
                                                <span className={cn("text-[11px] font-medium", item.done ? "text-slate-500 line-through" : "text-slate-300")}>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-auto p-4 rounded-xl bg-[#0a0f1c] border border-[#1e3a5f]/30 flex items-start gap-3">
                                    <Info size={14} className="text-slate-600 mt-0.5" />
                                    <p className="text-[10px] text-slate-600 font-medium italic">
                                        Entities in &apos;Stage 2&apos; are ready for promotion once conflicts are zeroed out.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right AI Intellect Panel */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out border-l border-[#1e3a5f]/40 bg-[#0d1424] overflow-hidden flex flex-col h-full",
                        aiPanelOpen ? "w-[350px] min-w-[350px]" : "w-0 border-l-0"
                    )}>
                        <AIAssistant 
                            actions={aiActions} 
                            askAI={askAI} 
                            isPanel={true} 
                            onClose={() => setAIPanelOpen(false)} 
                        />
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
