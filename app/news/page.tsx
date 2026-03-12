
"use client";

import { useInvestigationStore } from "@/store/investigationStore";
import NewsFeed from "@/components/news/NewsFeed";
import { 
    ShieldCheck, 
    AlertCircle, 
    Activity
} from "lucide-react";

export default function NewsPage() {
    const { currentCaseId } = useInvestigationStore();

    if (!currentCaseId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#0a0f1c] p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 text-slate-500">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Access Restricted</h2>
                <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                    Please select or initialize an investigation from the sidebar to activate the OSINT signal monitoring system.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c]">
            {/* Top Stat Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-[#1e3a5f]/30">
                <div className="flex items-center gap-4 px-6 py-4 bg-[#0d1424]/50 border-r border-[#1e3a5f]/30">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Latency</p>
                        <p className="text-sm font-bold text-white font-mono">24ms</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-4 bg-[#0d1424]/30 border-r border-[#1e3a5f]/30">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trust Index</p>
                        <p className="text-sm font-bold text-white font-mono">98.4%</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-4 bg-[#0d1424]/50">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Alerts</p>
                        <p className="text-sm font-bold text-white font-mono">3 Signals</p>
                    </div>
                </div>
            </div>

            {/* Main News Feed Component */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <NewsFeed caseId={currentCaseId} />
            </div>
        </div>
    );
}
