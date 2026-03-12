"use client";

import { motion } from "framer-motion";
import { 
    Users, 
    MessageSquare, 
    History, 
    CheckCircle2, 
    Shield,
    Terminal,
    Eye,
    Zap,
    Layout
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { cn } from "@/lib/utils";

// --- Mock Data ---
const activeAnalysts = [
    { name: "Sarah K.", role: "Lead Analyst", activity: "Viewing Timeline", color: "bg-purple-500", status: "Active" },
    { name: "Mark J.", role: "Forensic Accountant", activity: "Editing Entities", color: "bg-blue-500", status: "Idle" },
    { name: "James D.", role: "OSINT Specialst", activity: "Uploading Data", color: "bg-emerald-500", status: "Active" },
];

const auditLogs = [
    { user: "Sarah K.", action: "Promoted 'Nicosia Bank Transfers' to Timeline", time: "2 min ago", icon: <Zap size={12} className="text-blue-400" /> },
    { user: "James D.", action: "Resolved Conflict: Alexander Volkov identity", time: "15 min ago", icon: <CheckCircle2 size={12} className="text-emerald-400" /> },
    { user: "Mark J.", action: "Flagged 'Project Nexus' status as High Sensitivity", time: "1h ago", icon: <Shield size={12} className="text-red-400" /> },
    { user: "Sarah K.", action: "Generated new Case Hypothesis: Offshore Loop", time: "2h ago", icon: <Terminal size={12} className="text-purple-400" /> },
];

const tasks = [
    { title: "Verify Synergy Corp beneficial ownership", priority: "High", status: "In Progress" },
    { title: "Reconcile Cyprus travel logs with Swift logs", priority: "Medium", status: "To Do" },
    { title: "Review offshore entity registration date", priority: "Low", status: "Done" },
];

export default function CollaborationPage() {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0f1c] font-sans text-slate-300">
            <Sidebar />
            
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                <Topbar />

                <main className="flex-1 overflow-hidden p-6 gap-6 grid grid-cols-3 grid-rows-2 relative z-10">
                    
                    {/* Live Case Audit (Spans 2 rows on left) */}
                    <div className="col-span-1 row-span-2 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm">
                        <div className="px-6 py-5 border-b border-[#1e3a5f]/40 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History size={16} className="text-blue-400" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Case Audit Stream</h3>
                            </div>
                            <button className="text-[10px] font-bold text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors">See full log</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {auditLogs.map((log, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-4 group"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-[#0a0f1c] border border-[#1e3a5f]/40 flex items-center justify-center shrink-0 shadow-inner group-hover:border-blue-500/30 transition-all">
                                        {log.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-300 leading-relaxed mb-1">
                                            <span className="text-white font-bold">{log.user}</span> {log.action}
                                        </p>
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{log.time}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-4 bg-blue-500/5 border-t border-[#1e3a5f]/20 mx-4 mb-4 rounded-2xl flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                                <span className="text-[8px] font-black text-blue-400 uppercase">Immutable Blockchain Logged</span>
                            </div>
                        </div>
                    </div>

                    {/* Team Workspace (Top Right) */}
                    <div className="col-span-2 row-span-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm">
                        <div className="px-6 py-5 border-b border-[#1e3a5f]/40 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users size={16} className="text-emerald-400" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Active Analysts</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-emerald-400 uppercase">3 Analysts Online</span>
                            </div>
                        </div>

                        <div className="flex-1 p-6 grid grid-cols-3 gap-4 overflow-y-auto custom-scrollbar">
                            {activeAnalysts.map((analyst, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-[#0a0f1c] border border-[#1e3a5f]/40 flex flex-col items-center text-center group hover:border-blue-500/30 transition-all">
                                    <div className="relative mb-3">
                                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white", analyst.color)}>
                                            {analyst.name[0]}{analyst.name.split(' ')[1][0]}
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#0a0f1c]",
                                            analyst.status === "Active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-700"
                                        )} />
                                    </div>
                                    <div className="text-sm font-black text-slate-200 uppercase tracking-tight mb-0.5">{analyst.name}</div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">{analyst.role}</div>
                                    
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 group-hover:bg-blue-500/10 transition-all">
                                        <Eye size={10} className="text-blue-400" />
                                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter truncate">{analyst.activity}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Project Task Board (Bottom Right) */}
                    <div className="col-span-2 row-span-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm">
                        <div className="px-6 py-5 border-b border-[#1e3a5f]/40 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Layout size={16} className="text-purple-400" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Case Milestone Tracker</h3>
                            </div>
                            <button className="px-3 py-1.5 rounded-lg bg-[#1e293b] border border-[#1e3a5f]/60 text-[10px] font-black text-white uppercase tracking-widest hover:bg-[#263144] transition-all">Add task</button>
                        </div>

                        <div className="flex-1 p-6 grid grid-cols-3 gap-6">
                            {["To Do", "In Progress", "Done"].map(status => (
                                <div key={status} className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{status}</span>
                                        <span className="text-[9px] font-bold text-slate-700">{tasks.filter(t => t.status === status).length}</span>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        {tasks.filter(t => t.status === status).map((task, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-[#0a0f1c] border border-[#1e3a5f]/40 shadow-sm group hover:border-slate-600 transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                        task.priority === "High" ? "bg-red-500/10 text-red-500 border border-red-500/20" : 
                                                        task.priority === "Medium" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                                                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                    )}>{task.priority}</span>
                                                </div>
                                                <div className="text-[11px] font-bold text-slate-300 leading-snug line-clamp-2">{task.title}</div>
                                            </div>
                                        ))}
                                        {tasks.filter(t => t.status === status).length === 0 && (
                                            <div className="flex-1 border border-dashed border-slate-800/50 rounded-xl flex items-center justify-center p-4">
                                                <span className="text-[9px] font-bold text-slate-800 uppercase italic">Empty</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Global Task Bar Overlay */}
            <div className="fixed bottom-6 right-[300px] z-50 pointer-events-none">
                <div className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(59,130,246,0.4)] transition-all cursor-pointer group hover:scale-110">
                    <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0a0f1c] flex items-center justify-center text-[9px] font-black">2</div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 10px; }
            `}</style>
        </div>
    );
}
