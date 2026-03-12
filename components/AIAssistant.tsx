"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, AlertTriangle, BarChart2, X, ChevronRight, Sparkles,
    Send, Paperclip, Mic, MicOff, MoreHorizontal, FileText, XCircle
} from "lucide-react";
import { AIAction } from "@/lib/data";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Message = {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    attachments?: AttachedFile[];
};

type AttachedFile = {
    name: string;
    size: number;
    type: string;
    preview?: string; // text preview for text-based files
};

type AIResponse = {
    answer: string;
    sources: string[];
};

interface AIAssistantProps {
    actions: AIAction[];
    askAI?: (question: string, caseId?: string) => Promise<AIResponse>;
    isPanel?: boolean;
    onClose?: () => void;
}

const iconMap: Record<AIAction["icon"], React.ReactNode> = {
    search: <Search size={10} />,
    alert: <AlertTriangle size={10} />,
    chart: <BarChart2 size={10} />,
};

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Extend window type for SpeechRecognition
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

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

    // File attachment state
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Voice input state
    const [isRecording, setIsRecording] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    // ── Auth & scroll ──────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setUserInitial(data.user.email[0].toUpperCase());
            else if (data.user?.user_metadata?.full_name)
                setUserInitial(data.user.user_metadata.full_name[0].toUpperCase());
        });
    }, []);

    useEffect(() => {
        if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading]);

    // ── Speech Recognition init ────────────────────────────────────
    useEffect(() => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            setVoiceSupported(true);
            const recognition = new SpeechRec();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results as any[])
                    .map((r: any) => r[0].transcript)
                    .join("");
                setQuestion(transcript);
            };

            recognition.onend = () => setIsRecording(false);
            recognition.onerror = () => setIsRecording(false);

            recognitionRef.current = recognition;
        }
    }, []);

    // ── Voice toggle ───────────────────────────────────────────────
    const toggleVoice = useCallback(() => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setQuestion("");
            recognitionRef.current.start();
            setIsRecording(true);
        }
    }, [isRecording]);

    // ── File handling ──────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        const parsed: AttachedFile[] = await Promise.all(
            files.map(async (file) => {
                let preview: string | undefined;
                // Read text content for text-based files (to inject into AI query)
                if (
                    file.type.startsWith("text/") ||
                    file.name.endsWith(".csv") ||
                    file.name.endsWith(".json") ||
                    file.name.endsWith(".md") ||
                    file.name.endsWith(".txt")
                ) {
                    preview = await file.text().then(t => t.slice(0, 3000)); // cap at 3k chars
                }
                return { name: file.name, size: file.size, type: file.type, preview };
            })
        );

        setAttachedFiles(prev => [...prev, ...parsed]);
        // Reset input so same file can be re-attached
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (index: number) =>
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));

    // ── Send message ───────────────────────────────────────────────
    async function handleAsk(q?: string) {
        const query = (q ?? question).trim();
        if ((!query && attachedFiles.length === 0) || !askAI) return;

        // Build enriched query with file contents
        let enrichedQuery = query;
        const textFiles = attachedFiles.filter(f => f.preview);
        if (textFiles.length > 0) {
            enrichedQuery +=
                "\n\n---\nThe following files were attached by the user:\n" +
                textFiles.map(f => `\n[File: ${f.name}]\n${f.preview}`).join("\n");
        }

        const userMsg: Message = {
            role: "user",
            content: query || `[Attached ${attachedFiles.length} file(s)]`,
            timestamp: new Date(),
            attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
        };

        setMessages(prev => [...prev, userMsg]);
        setQuestion("");
        setAttachedFiles([]);
        setLoading(true);
        setError(null);

        try {
            const result = await askAI(enrichedQuery || `Analyze the attached files: ${attachedFiles.map(f => f.name).join(", ")}`);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: result.answer,
                timestamp: new Date()
            }]);
        } catch (err) {
            console.error("AI error:", err);
            setError("Failed to reach Astra AI backend.");
        } finally {
            setLoading(false);
        }
    }

    const canSend = (question.trim().length > 0 || attachedFiles.length > 0) && !loading;

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

                        <div className="flex flex-col gap-1.5 max-w-[85%]">
                            {/* Bubble */}
                            <div className={cn(
                                "px-4 py-3 rounded-2xl text-[12px] leading-relaxed shadow-sm",
                                msg.role === "assistant"
                                    ? "bg-[#1e293b]/80 text-slate-200 border border-slate-800/50"
                                    : "bg-indigo-600 text-white font-medium"
                            )}>
                                {msg.content}
                            </div>

                            {/* Attached file chips */}
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {msg.attachments.map((f, fi) => (
                                        <div key={fi} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
                                            <FileText size={10} className="text-indigo-400 shrink-0" />
                                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{f.name}</span>
                                            <span className="text-[9px] text-slate-600">{formatBytes(f.size)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
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

            {/* ── Fixed input area ── */}
            <div className="shrink-0 p-4 pt-3 space-y-3 border-t border-[#1e3a5f]/20">

                {/* Attached file preview chips */}
                <AnimatePresence>
                    {attachedFiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-wrap gap-2"
                        >
                            {attachedFiles.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 group"
                                >
                                    <FileText size={11} className="text-indigo-400 shrink-0" />
                                    <span className="text-[10px] text-slate-300 font-medium max-w-[100px] truncate">{f.name}</span>
                                    <span className="text-[9px] text-slate-500">{formatBytes(f.size)}</span>
                                    <button
                                        onClick={() => removeFile(i)}
                                        className="text-slate-600 hover:text-rose-400 transition-colors ml-0.5"
                                    >
                                        <XCircle size={12} />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Voice recording indicator */}
                <AnimatePresence>
                    {isRecording && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25"
                        >
                            <motion.div
                                className="w-2 h-2 rounded-full bg-rose-500"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            />
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                                Listening… speak now
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main input field */}
                <div className="relative group">
                    <div className="bg-[#1a2333]/80 border border-slate-800 rounded-2xl p-2 px-4 shadow-sm group-focus-within:border-indigo-500/50 group-focus-within:ring-2 group-focus-within:ring-indigo-500/10 transition-all">
                        <input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) handleAsk();
                            }}
                            placeholder={isRecording ? "Listening…" : "Analyze Jensen's financial ties"}
                            className="w-full py-2 bg-transparent text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none"
                            disabled={loading}
                        />

                        <div className="flex items-center justify-between mt-1 pb-1">
                            <div className="flex items-center gap-3">
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".txt,.csv,.json,.md,.pdf,.xlsx,.xls,.docx,.doc,text/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {/* Paperclip button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading}
                                    title="Attach files"
                                    className={cn(
                                        "transition-colors",
                                        attachedFiles.length > 0
                                            ? "text-indigo-400 hover:text-indigo-300"
                                            : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <Paperclip size={16} />
                                </button>

                                {/* Mic button */}
                                {voiceSupported && (
                                    <button
                                        onClick={toggleVoice}
                                        disabled={loading}
                                        title={isRecording ? "Stop recording" : "Voice input"}
                                        className={cn(
                                            "transition-all",
                                            isRecording
                                                ? "text-rose-400 hover:text-rose-300 animate-pulse"
                                                : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                )}
                            </div>

                            {/* Send button */}
                            <button
                                onClick={() => handleAsk()}
                                disabled={!canSend}
                                className={cn(
                                    "p-1.5 rounded-xl transition-all",
                                    canSend
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500"
                                        : "text-slate-600 cursor-not-allowed"
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
