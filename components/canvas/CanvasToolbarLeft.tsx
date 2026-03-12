"use client";

import { cn } from "@/lib/utils";
import { Brain, Loader2, Plus } from "lucide-react";
import { useInvestigationStore } from "@/store/investigationStore";

interface CanvasToolbarLeftProps {
    analyzing: boolean;
    runAIAnalysis: () => void;
    addNewEntity: () => void;
    activeFilter: string;
    setActiveFilter: (f: string) => void;
    aiMessage: string | null;
}

export default function CanvasToolbarLeft({
    analyzing,
    runAIAnalysis,
    addNewEntity,
    activeFilter,
    setActiveFilter,
    aiMessage,
}: CanvasToolbarLeftProps) {
    const { addStickyNote } = useInvestigationStore();

    return (
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
            <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#0d1424]/90 border border-[#1e3a5f]/50 backdrop-blur-sm shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Investigation Canvas</span>
            </div>

            <button
                onClick={runAIAnalysis}
                disabled={analyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/40"
            >
                {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Brain size={13} />}
                <span className="text-[10px] font-black uppercase tracking-wider">AI Analysis</span>
            </button>

            <button
                onClick={addNewEntity}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1424]/90 border border-[#1e3a5f]/50 hover:bg-slate-800 text-slate-300 transition-all shadow-sm backdrop-blur-sm"
            >
                <Plus size={13} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Add Entity</span>
            </button>

            <button
                onClick={() => addStickyNote({ x: 400, y: 300 })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fde88a]/90 backdrop-blur-sm border border-[#d6b83f]/50 text-[#422006] hover:bg-[#f0d060] transition-all shadow-sm font-black text-[10px] uppercase tracking-wider"
            >
                <Plus size={13} strokeWidth={3} />
                Sticky
            </button>

            <div className="h-5 w-px bg-slate-700/50" />

            <div className="flex bg-[#0d1424]/90 backdrop-blur-sm p-0.5 rounded-lg border border-[#1e3a5f]/50 shadow-sm">
                {["all", "entity", "evidence"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={cn(
                            "px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                            activeFilter === f ? "bg-blue-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {aiMessage && (
                <div className={cn(
                    "px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-left-2",
                    aiMessage.startsWith("⚠️") || aiMessage.startsWith("⏱")
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : aiMessage.startsWith("✓")
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                )}>
                    {aiMessage}
                </div>
            )}
        </div>
    );
}
