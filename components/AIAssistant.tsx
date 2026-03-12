"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, AlertTriangle, BarChart2, X, ChevronRight, Sparkles, Minimize2, Send } from "lucide-react";
import { AIAction } from "@/lib/data";
import { cn } from "@/lib/utils";

type AIResponse = {
    answer: string;
    sources: string[];
};

interface AIAssistantProps {
    actions: AIAction[];
    askAI?: (question: string) => Promise<AIResponse>;
}

const iconMap: Record<AIAction["icon"], React.ReactNode> = {
    search: <Search size={10} />,
    alert: <AlertTriangle size={10} />,
    chart: <BarChart2 size={10} />,
};

const priorityColors: Record<AIAction["priority"], string> = {
    high: "text-red-400 bg-red-500/10 border-red-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function AIAssistant({ actions, askAI }: AIAssistantProps) {
    const [minimized, setMinimized] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (dismissed) return null;

    async function handleAsk(q?: string) {
        const query = (q ?? question).trim();
        if (!query || !askAI) return;

        setLoading(true);
        setResponse(null);
        setError(null);

        try {
            const result = await askAI(query);
            setResponse(result);
        } catch (err) {
            console.error("AI error:", err);
            setError("Failed to reach Astra AI. Make sure the backend is running.");
        } finally {
            setLoading(false);
            setQuestion("");
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-4 right-4 z-20 w-72"
            >
                <div className="bg-[#0d1424] border border-[#1e3a5f]/70 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)]">

                    {/* Header */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-[#1e3a5f]/50">
                        <div className="relative">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Brain size={12} className="text-white" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-[#0d1424]" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                    Astra AI
                                </span>
                                <Sparkles size={8} className="text-blue-400" />
                            </div>
                            <div className="text-[8px] text-slate-500">
                                AI Investigation Assistant
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setMinimized(!minimized)}
                                className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors"
                            >
                                <Minimize2 size={10} />
                            </button>

                            <button
                                onClick={() => setDismissed(true)}
                                className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <AnimatePresence>
                        {!minimized && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                {/* Suggested Actions */}
                                {!response && (
                                    <div className="p-3 space-y-2">
                                        <div className="text-[8px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
                                            Suggested Actions
                                        </div>
                                        {actions.map((action, i) => (
                                            <motion.button
                                                key={action.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                whileHover={{ x: 2 }}
                                                onClick={() => handleAsk(action.text)}
                                                className="w-full flex items-center gap-2 group text-left"
                                            >
                                                <div
                                                    className={cn(
                                                        "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border",
                                                        priorityColors[action.priority]
                                                    )}
                                                >
                                                    {iconMap[action.icon]}
                                                </div>

                                                <span className="text-[10px] text-slate-400 group-hover:text-slate-200 transition-colors leading-snug flex-1">
                                                    {action.text}
                                                </span>

                                                <ChevronRight
                                                    size={10}
                                                    className="text-slate-700 group-hover:text-slate-400 flex-shrink-0 transition-colors"
                                                />
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                {/* AI Response */}
                                <AnimatePresence>
                                    {response && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="px-3 pt-3 pb-2"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles size={9} className="text-blue-400" />
                                                    <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-widest">
                                                        Astra Response
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setResponse(null)}
                                                    className="text-[8px] text-slate-600 hover:text-slate-400 transition-colors"
                                                >
                                                    ← Back
                                                </button>
                                            </div>

                                            <div className="text-[10px] text-slate-300 leading-relaxed bg-[#1e293b]/60 rounded-lg p-2.5 border border-[#1e3a5f]/40 max-h-40 overflow-y-auto">
                                                {response.answer}
                                            </div>

                                            {response.sources && response.sources.length > 0 && (
                                                <div className="mt-2">
                                                    <div className="text-[8px] font-semibold text-slate-600 uppercase tracking-widest mb-1">
                                                        Sources
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {response.sources.map((src, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-1.5 py-0.5 text-[8px] rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                            >
                                                                {src}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error */}
                                {error && (
                                    <div className="px-3 pb-2 text-[9px] text-red-400 bg-red-500/5 border-t border-red-500/10 pt-2">
                                        ⚠ {error}
                                    </div>
                                )}

                                {/* Input */}
                                <div className="px-3 pb-3 pt-1">
                                    <div className="relative">
                                        <input
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleAsk();
                                            }}
                                            placeholder="Ask Astra AI..."
                                            disabled={loading}
                                            className="w-full px-3 py-2 pr-8 text-[10px] bg-[#1e293b] border border-[#1e3a5f]/60 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-all disabled:opacity-50"
                                        />

                                        <button
                                            onClick={() => handleAsk()}
                                            disabled={loading || !question.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-400 disabled:opacity-30 transition-colors"
                                        >
                                            <Send size={10} />
                                        </button>
                                    </div>

                                    {loading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-1.5 mt-2"
                                        >
                                            <div className="flex gap-0.5">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1 h-1 rounded-full bg-blue-400"
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[9px] text-blue-400">
                                                Astra is analysing evidence...
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
