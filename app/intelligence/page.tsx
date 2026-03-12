"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Send, Search, AlertTriangle, BarChart2, ChevronRight, X, Maximize2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { aiActions } from "@/lib/data";
import { useState } from "react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
    search: <Search size={14} />,
    alert: <AlertTriangle size={14} />,
    chart: <BarChart2 size={14} />,
};

const priorityColors: Record<string, string> = {
    high: "text-red-400 bg-red-400/10 border-red-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

export default function AIIntelligencePage() {
    const [question, setQuestion] = useState("");

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0f1c] font-sans text-slate-300">
            <Sidebar />
            
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                <Topbar />

                {/* Background Glows */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />

                <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full max-w-2xl bg-[#0d1424] border border-[#1e3a5f]/60 rounded-3xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-[#1e3a5f]/40">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Brain size={24} className="text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-[3px] border-[#0d1424]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg font-black text-white uppercase tracking-widest">Astra AI</h1>
                                        <Sparkles size={12} className="text-blue-400" />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">AI Investigation Assistant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all">
                                    <Maximize2 size={16} />
                                </button>
                                <button className="p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Suggested Actions</div>
                                <div className="grid gap-3">
                                    {aiActions.map((action, i) => (
                                        <motion.button
                                            key={action.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                                            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-[#1e3a5f]/40 transition-all group group text-left"
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110",
                                                priorityColors[action.priority]
                                            )}>
                                                {iconMap[action.icon]}
                                            </div>
                                            <span className="flex-1 text-[13px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                                                {action.text}
                                            </span>
                                            <ChevronRight size={16} className="text-slate-700 group-hover:text-slate-400 transition-all" />
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="relative pt-4">
                                <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full pointer-events-none" />
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="Ask Astra AI..."
                                        className="w-full px-6 py-5 bg-[#161f33] border border-[#1e3a5f]/60 rounded-2xl text-sm font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#1a253d] transition-all shadow-inner"
                                    />
                                    <button className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="px-8 py-4 bg-white/[0.02] border-t border-[#1e3a5f]/20 flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            <span>Neural Engine: Llama-3-70B</span>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-500/80">System Ready</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
