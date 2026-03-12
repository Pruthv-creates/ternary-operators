"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, AlertTriangle, BarChart2, X, ChevronRight, Sparkles, Send, Paperclip, Mic, MoreHorizontal } from "lucide-react";
import { AIAction } from "@/lib/data";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Message = {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
};

type AIResponse = {
    answer: string;
    sources: string[];
};

interface AIAssistantProps {
    actions: AIAction[];
    askAI?: (question: string) => Promise<AIResponse>;
    isPanel?: boolean;
    onClose?: () => void;
}

const iconMap: Record<AIAction["icon"], React.ReactNode> = {
    search: <Search size={10} />,
    alert: <AlertTriangle size={10} />,
    chart: <BarChart2 size={10} />,
};

export default function AIAssistant({ actions, askAI, isPanel, onClose }: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Analyzed 'Global Trading Corp' links. Found nexus to Sarah Jensen, announced with Investigation and analysis or marketing investigation.",
            timestamp: new Date()
        }
    ]);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userInitial, setUserInitial] = useState("U");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) {
                setUserInitial(data.user.email[0].toUpperCase());
            } else if (data.user?.user_metadata?.full_name) {
                setUserInitial(data.user.user_metadata.full_name[0].toUpperCase());
            }
        });
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    async function handleAsk(q?: string) {
        const query = (q ?? question).trim();
        if (!query || !askAI) return;

        const userMsg: Message = { role: "user", content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setQuestion("");
        setLoading(true);
        setError(null);

        try {
            const result = await askAI(query);
            const assistantMsg: Message = {
                role: "assistant",
                content: result.answer,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            console.error("AI error:", err);
            setError("Failed to reach Astra AI backend.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={cn(
            "bg-[#0d1424] flex flex-col h-full overflow-hidden",
            !isPanel && "border border-[#1e3a5f]/70 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] w-[350px] fixed bottom-4 right-4 z-50"
        )}>

            {/* ── Header (fixed) ── */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-[#1e3a5f]/30">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="text-xs font-black text-white italic">AI</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[13px] font-bold text-white truncate">Intellect AI</span>
                        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 transition-colors">
                        <MoreHorizontal size={14} />
                    </button>
                    {isPanel ? (
                        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Scrollable area: messages + suggestion pills ── */}
            <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto scroll-smooth custom-scrollbar p-4 flex flex-col gap-6"
            >
                {/* Messages */}
                {messages.map((msg, i) => (
                    <div key={i} className={cn(
                        "flex gap-3",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}>
                        {/* Avatar */}
                        <div className={cn(
                            "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white",
                            msg.role === "assistant"
                                ? "bg-indigo-600 shadow-md shadow-indigo-900/40"
                                : "bg-gradient-to-br from-purple-500 to-blue-500"
                        )}>
                            {msg.role === "assistant"
                                ? <Sparkles size={14} />
                                : <div className="text-[10px] font-bold uppercase">{userInitial}</div>
                            }
                        </div>

                        {/* Bubble */}
                        <div className={cn(
                            "max-w-[85%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed shadow-sm",
                            msg.role === "assistant"
                                ? "bg-[#1e293b]/80 text-slate-200 border border-slate-800/50"
                                : "bg-indigo-600 text-white font-medium"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
                            <Sparkles size={14} className="animate-spin-slow" />
                        </div>
                        <div className="bg-[#1e293b]/80 border border-slate-800/50 rounded-2xl px-4 py-3 flex gap-1 items-center">
                            {[0, 1, 2].map(d => (
                                <motion.div
                                    key={d}
                                    className="w-1 h-1 rounded-full bg-indigo-400"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-[10px] text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 flex items-center gap-2">
                        <AlertTriangle size={12} />
                        {error}
                    </div>
                )}

                {/* Suggestion pills — scroll with messages */}
                {!loading && actions.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Suggested Queries</p>
                        {actions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => handleAsk(action.text)}
                                className="w-full text-left px-4 py-2.5 rounded-xl border border-slate-800/80 bg-[#111827]/50 hover:bg-white/5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:border-indigo-500/40 transition-all shadow-sm"
                            >
                                {action.text}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Fixed input area — always at the bottom ── */}
            <div className="shrink-0 p-4 pt-3 space-y-3 border-t border-[#1e3a5f]/20">
                <div className="relative group">
                    <div className="bg-[#1a2333]/80 border border-slate-800 rounded-2xl p-2 px-4 shadow-sm group-focus-within:border-indigo-500/50 group-focus-within:ring-2 group-focus-within:ring-indigo-500/10 transition-all">
                        <input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAsk();
                            }}
                            placeholder="Analyze Jensen's financial ties"
                            className="w-full py-2 bg-transparent text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none"
                            disabled={loading}
                        />

                        <div className="flex items-center justify-between mt-1 pb-1">
                            <div className="flex items-center gap-3">
                                <button className="text-slate-500 hover:text-slate-300 transition-colors">
                                    <Paperclip size={16} />
                                </button>
                                <button className="text-slate-500 hover:text-slate-300 transition-colors">
                                    <Mic size={16} />
                                </button>
                            </div>

                            <button
                                onClick={() => handleAsk()}
                                disabled={!question.trim() || loading}
                                className={cn(
                                    "p-1.5 rounded-xl transition-all",
                                    question.trim()
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "text-slate-600"
                                )}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Astra Model v4.0</span>
                </div>
            </div>
        </div>
    );
}
