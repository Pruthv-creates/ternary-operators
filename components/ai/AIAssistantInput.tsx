import { useRef, useCallback } from "react";
import { Paperclip, Mic, MicOff, Send, FileText, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AttachedFile } from "./types";
import { formatBytes } from "./utils";

interface AIAssistantInputProps {
    question: string;
    setQuestion: (val: string) => void;
    attachedFiles: AttachedFile[];
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: (index: number) => void;
    isRecording: boolean;
    voiceSupported: boolean;
    toggleVoice: () => void;
    handleAsk: () => void;
    loading: boolean;
    canSend: boolean;
}

export function AIAssistantInput({
    question,
    setQuestion,
    attachedFiles,
    handleFileChange,
    removeFile,
    isRecording,
    voiceSupported,
    toggleVoice,
    handleAsk,
    loading,
    canSend
}: AIAssistantInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
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
    );
}
