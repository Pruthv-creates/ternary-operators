"use client";

import { motion } from "framer-motion";
import { 
    FileText, 
    Zap, 
    ArrowUpRight, 
    Brain, 
    Clock, 
    Users, 
    AlertTriangle,
    CheckCircle2, 
    Activity,
    BarChart3,
    Share2,
    Lock
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ingestedFiles = [
    { id: 1, name: "Travel_Logs_Sarah.csv", size: "42KB", status: "ready", timestamp: "10m ago" },
    { id: 2, name: "Shell_Co_Registration.pdf", size: "1.2MB", status: "processing", progress: 88, timestamp: "2m ago" },
    { id: 3, name: "Nicosia_Bank_Transfers.xlsx", size: "856KB", status: "indexed", timestamp: "1h ago" },
];

const rawDataPreview = `DATE,ORIGIN,DESTINATION,FLIGHT_ID,CARRIER
2023-07-12,LHR,LCA,CYP452,Cyprus Airways
2023-07-15,LCA,LHR,CYP453,Cyprus Airways
2023-08-01,LHR,DXB,EK002,Emirates
2023-08-05,DXB,LHR,EK003,Emirates
2023-09-12,LHR,LCA,CYP452,Cyprus Airways`;

const auditLog = [
    { user: "Sarah", action: "promoted Travel Logs to Timeline", time: "2 min ago", type: "promotion" },
    { user: "System", action: "indexed Shell_Co_Registration.pdf", time: "5 min ago", type: "system" },
    { user: "Sarah", action: "merged entity 'Alexander V.' with 'A. Volkov'", time: "12 min ago", type: "entity" },
];

import { useInvestigationStore } from "@/store/investigationStore";
import { useAI } from "@/hooks/useAI";
import AIAssistant from "@/components/AIAssistant";
import { aiActions } from "@/lib/data";

// --- Mock Data ---

export default function CasesPage() {
    const { aiPanelOpen, setAIPanelOpen } = useInvestigationStore();
    const { askAI } = useAI();
    const [selectedFile, setSelectedFile] = useState(ingestedFiles[0]);

    return (
        <main className="flex-1 overflow-hidden p-6 gap-6 flex relative z-10">
                    <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-6">
                    
                    {/* UI Section 1: Case Detail Header (Top Banner - Spans All Columns) */}
                    <div className="col-span-12 row-span-2 bg-[#0d1424] border border-[#1e3a5f]/40 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-2xl font-black text-white tracking-tight">Project Nexus</h1>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium tracking-wide">Primary Financial Crime Investigation • Created 2026-03-11</p>
                            </div>
                            
                            <div className="h-10 w-px bg-slate-800/50" />
                            
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Entities</div>
                                    <div className="text-lg font-bold text-slate-200">24 <span className="text-[10px] text-emerald-500 text-normal ml-1">↑ 2</span></div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Timeline</div>
                                    <div className="text-lg font-bold text-slate-200">142</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Conflicts</div>
                                    <div className="text-lg font-bold text-red-400/80">3</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right mr-4">
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Lead Analyst</div>
                                <div className="text-xs font-semibold text-slate-300">Sarah K.</div>
                            </div>
                            <button className="px-4 py-2 rounded-xl bg-[#1e293b] border border-[#1e3a5f]/60 text-xs font-bold text-white hover:bg-[#263144] transition-all flex items-center gap-2">
                                <Share2 size={14} className="text-blue-400" />
                                Export Intel
                            </button>
                        </div>
                    </div>

                    {/* Left Column: Promotion Pipeline (Middle) */}
                    <div className="col-span-8 row-span-10 grid grid-rows-10 gap-6">
                        
                        {/* UI Section 2: Evidence Pipeline Workspace */}
                        <div className="row-span-7 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-2xl overflow-hidden flex flex-col backdrop-blur-sm">
                            <div className="px-6 py-4 border-b border-[#1e3a5f]/40 bg-gradient-to-r from-blue-500/5 to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity size={16} className="text-blue-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Evidence Ingestion Pipeline</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase">Indexing Engine Active</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex min-h-0">
                                {/* File List */}
                                <div className="w-64 border-r border-[#1e3a5f]/30 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-1">Raw Ingest Feed</div>
                                    {ingestedFiles.map(file => (
                                        <div 
                                            key={file.id}
                                            onClick={() => setSelectedFile(file)}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all cursor-pointer group",
                                                selectedFile.id === file.id 
                                                    ? "bg-blue-500/10 border-blue-500/40" 
                                                    : "border-transparent hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <FileText size={14} className={cn(selectedFile.id === file.id ? "text-blue-400" : "text-slate-500")} />
                                                <span className="text-[10px] font-medium text-slate-300 truncate flex-1">{file.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] font-bold text-slate-600 tracking-wider uppercase">{file.size}</span>
                                                {file.status === "processing" ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[8px] font-bold text-blue-400 animate-pulse">{file.progress}%</span>
                                                        <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500" style={{ width: `${file.progress}%` }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <CheckCircle2 size={10} className="text-emerald-500/60" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Raw Data & AI Recommendations */}
                                <div className="flex-1 flex flex-col p-6 min-w-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Reviewing:</span>
                                            <span className="text-xs font-semibold text-white">{selectedFile.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Lock size={10} />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">Immutable Record</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                                        {/* Raw View */}
                                        <div className="bg-[#0a0f1c] border border-[#1e3a5f]/30 rounded-xl p-4 font-mono text-[10px] text-slate-500 overflow-y-auto leading-relaxed custom-scrollbar whitespace-pre shadow-inner">
                                            {rawDataPreview}
                                        </div>

                                        {/* AI Recommendation */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex-1 bg-blue-600/5 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-3 opacity-20">
                                                    <Brain size={24} className="text-blue-400" />
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Astra AI Strategy</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-300 leading-relaxed mb-4 italic">
                                                    &quot;These travel logs indicate multiple unlisted flights to Nicosia, Cyprus. This pattern is highly consistent with the known shell company registration locations for Project Nexus. Recommendation: Coordinate with financial timeline.&quot;
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Confidence Score: 94%</div>
                                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                                                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                                <p className="text-[10px] text-slate-400 leading-snug">
                                                    <span className="text-amber-400 font-bold uppercase tracking-tight">Signal Match:</span> 3 entries correlate with suspicious transfers already on the timeline.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* UI Section 3: Promotion Controls */}
                        <div className="row-span-3 grid grid-cols-4 gap-4">
                            {[
                                { label: "Promote to Canvas", icon: <ArrowUpRight />, sub: "Add to relationship map", color: "blue" },
                                { label: "Promote to Timeline", icon: <Clock />, sub: "Add chronologically", color: "emerald" },
                                { label: "Create Entities", icon: <Users />, sub: "Extract from raw data", color: "purple" },
                                { label: "New Hypothesis", icon: <Brain />, sub: "Generate case theory", color: "amber" }
                            ].map((btn, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.03)" }}
                                    className="h-full bg-[#0d1424] border border-[#1e3a5f]/40 rounded-2xl p-5 flex flex-col items-center justify-center text-center group transition-all"
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center border mb-3 group-hover:scale-110 transition-transform",
                                        btn.color === "blue" && "bg-blue-500/10 border-blue-500/20 text-blue-400",
                                        btn.color === "emerald" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                                        btn.color === "purple" && "bg-purple-500/10 border-purple-500/20 text-purple-400",
                                        btn.color === "amber" && "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    )}>
                                        {btn.icon}
                                    </div>
                                    <div className="text-[11px] font-black text-white uppercase tracking-widest mb-1">{btn.label}</div>
                                    <div className="text-[9px] text-slate-600 font-bold uppercase">{btn.sub}</div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Case Insights & Dashboard */}
                    <div className="col-span-4 row-span-10 flex flex-col gap-6">
                        
                        {/* UI Section 4: Case Insights Dashboard */}
                        <div className="flex-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#1e3a5f]/40 bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <BarChart3 size={16} className="text-purple-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Case Intelligence Hub</h3>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                                {/* Mini Map Placeholder */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Promotion Radar</span>
                                        <span className="text-[9px] font-bold text-blue-400 uppercase">3 High Sig Clusters</span>
                                    </div>
                                    <div className="aspect-video bg-[#0a0f1c] rounded-xl border border-[#1e3a5f]/30 relative flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1e3a5f_1px,transparent_1px)] [background-size:16px_16px]" />
                                        <div className="relative">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full blur-[2px] animate-ping" />
                                            <div className="w-24 h-24 border border-blue-500/20 rounded-full absolute -top-10 -left-10" />
                                            <div className="w-16 h-16 border border-blue-500/10 rounded-full absolute -top-6 -left-6" />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest relative z-10">Un-promoted Entity Mapping</span>
                                    </div>
                                </div>

                                {/* Hypotheses */}
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Active Hypotheses</div>
                                    <div className="space-y-2">
                                        {[
                                            { title: "Volkov Shell Co Integration", status: "Validated", color: "emerald" },
                                            { title: "Nicosia Money Laundering Loop", status: "Exploration", color: "blue" }
                                        ].map((h, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-300">{h.title}</span>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                    h.color === "emerald" ? "text-emerald-400 border-emerald-500/30" : "text-blue-400 border-blue-500/30"
                                                )}>{h.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Audit Log */}
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Audit & activity</div>
                                    <div className="space-y-4">
                                        {auditLog.map((log, i) => (
                                            <div key={i} className="flex gap-3 items-start">
                                                <div className={cn(
                                                    "w-1 h-1 rounded-full mt-1.5 shrink-0",
                                                    log.type === "promotion" ? "bg-blue-400" : log.type === "system" ? "bg-slate-600" : "bg-purple-400"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-slate-400 leading-tight">
                                                        <span className="text-slate-200 font-bold">[{log.user}]</span> {log.action}
                                                    </p>
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1 block">{log.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integration Status */}
                        <div className="h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap size={14} className="text-blue-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Promotion Queue</span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase">12 Assets Ready</span>
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
    );
}
