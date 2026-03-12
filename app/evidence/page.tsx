"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigationStore } from "@/store/investigationStore";
import { getCaseDocuments } from "@/app/actions/case";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Brain,
  Sparkles,
  ChevronRight,
  Trash2,
  Send,
  Archive,
  FileSearch,
  ShieldAlert,
  Info,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  message?: string;
  timestamp: Date;
  fileType?: string;
}

type AIResponse = { answer: string; sources: string[] };

export default function EvidencePage() {
  const { currentCaseId } = useInvestigationStore();
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load case-specific evidence on mount/case change
  useEffect(() => {
    async function fetchDocs() {
      if (!currentCaseId) return;
      try {
        const docs = await getCaseDocuments(currentCaseId);
        const mapped: EvidenceFile[] = docs.map(d => ({
          id: d.id,
          name: d.title,
          size: 0, // Metadata might not have size
          status: "success",
          timestamp: new Date(d.createdAt),
          fileType: d.fileType
        }));
        setFiles(mapped);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      }
    }
    fetchDocs();
  }, [currentCaseId]);

  /* ── Drag & Drop ── */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  /* ── Upload ── */
  async function handleFiles(newFiles: File[]) {
    if (!currentCaseId) {
      alert("Please select or create an investigation case first.");
      return;
    }

    const uploads: EvidenceFile[] = newFiles.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      status: "uploading",
      timestamp: new Date(),
    }));

    setFiles((prev) => [...uploads, ...prev]);

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const entry = uploads[i];

      const fd = new FormData();
      fd.append("file", file);
      // Pass caseId to backend
      fd.append("caseId", currentCaseId);

      try {
        // Updated API path to include caseId query param or body
        const res = await fetch(`/api/ai/upload?caseId=${currentCaseId}`, { 
          method: "POST", 
          body: fd 
        });
        
        if (!res.ok) throw new Error();
        const data = await res.json();

        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "success", message: data.message ?? "Indexed into Case Vault" }
              : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "error", message: "Security Scan Hook Failed" }
              : f
          )
        );
      }
    }
  }

  /* ── Ask AI ── */
  async function askAI() {
    if (!question.trim() || !currentCaseId) return;
    setLoading(true);
    setAiResult(null);
    setAiError(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, caseId: currentCaseId }),
      });
      if (!res.ok) throw new Error();
      const data: AIResponse = await res.json();
      setAiResult(data);
    } catch {
      setAiError("Astra AI is currently unavailable for this cluster. Verify RAG engine status.");
    } finally {
      setLoading(false);
    }
  }

  function formatBytes(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  }

  const statusIcon: Record<UploadStatus, React.ReactNode> = {
    idle: null,
    uploading: <Loader2 size={14} className="animate-spin text-blue-400" />,
    success: <CheckCircle2 size={14} className="text-emerald-400" />,
    error: <ShieldAlert size={14} className="text-red-400" />,
  };

  return (
    <>
        {/* Hero Section Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />

        <main className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Header */}
            <div className="flex items-end justify-between border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Archive size={16} className="text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Evidence Vault</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Intelligence Library</h1>
                <p className="text-sm text-slate-500 mt-1 max-w-xl">
                  Upload reports, intercepted communications, and financial logs. Astra will ingest them into your case RAG model for context-aware intelligence.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Model Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-emerald-400">Llama3 Active</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* Left Column: Upload & Files */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                
                {/* Upload Zone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300",
                    dragging 
                      ? "border-blue-500 bg-blue-500/10" 
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                  
                    <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.pdf,.md,.csv,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                  />

                  <div className="p-12 flex flex-col items-center text-center">
                    <div className="mb-4 relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 group-hover:scale-[2] transition-transform duration-500" />
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center relative z-10">
                            <Upload size={28} className={cn("text-blue-400 transition-transform duration-300", dragging && "scale-125")} />
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">
                        {dragging ? "Release to Index" : "Deploy Evidence Base"}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                        Drop high-sig Intel reports, financial logs, or <span className="text-blue-400 font-bold">visual evidence</span> here. <br/>
                        <span className="text-slate-600">Supports text, PDF, and high-res imagery for OCR analysis.</span>
                    </p>

                    <button className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/20 transition-all">
                        Browse Filesystem
                    </button>
                  </div>
                </motion.div>

                {/* File Management */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileSearch size={16} className="text-slate-400" />
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Ingested Evidence</h3>
                        </div>
                        {files.length > 0 && (
                            <button 
                                onClick={() => setFiles([])}
                                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5"
                            >
                                <Trash2 size={12} /> Purge Index
                            </button>
                        )}
                    </div>

                    <div className="min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
                        <AnimatePresence initial={false}>
                            {files.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 opacity-30">
                                    <Archive size={40} className="text-slate-500 mb-2" />
                                    <span className="text-sm font-medium">No active intelligence in the library</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/50">
                                    {files.map((file) => (
                                        <motion.div
                                            key={file.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="px-6 py-4 flex items-center gap-4 hover:bg-white/2 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center border border-slate-700/50 text-slate-400 group-hover:text-blue-400 transition-colors">
                                                {file.name.match(/\.(jpg|jpeg|png|webp)$/i) ? <ImageIcon size={18} /> : <FileText size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-slate-200 truncate">{file.name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                                                        {file.name.match(/\.(jpg|jpeg|png|webp)$/i) ? "Visual Evidence" : formatBytes(file.size)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600">•</span>
                                                    <span className="text-[10px] text-slate-600 font-mono uppercase font-medium">
                                                        {file.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    {file.status === "uploading" && <span className="text-[9px] text-blue-400 font-bold uppercase animate-pulse">Analysing...</span>}
                                                    {file.status === "success" && <span className="text-[9px] text-emerald-400 font-bold uppercase">Indexed</span>}
                                                    {file.status === "error" && <span className="text-[9px] text-red-400 font-bold uppercase">Blocked</span>}
                                                    {statusIcon[file.status]}
                                                </div>
                                                {file.message && (
                                                    <span className={cn("text-[9px] font-medium leading-none", file.status === "error" ? "text-red-500" : "text-slate-500")}>
                                                        {file.message}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
              </div>

              {/* Right Column: AI Panel - STICKY to prevent disappearing on long lists */}
              <div className="col-span-12 lg:col-span-5 relative">
                <div className="sticky top-8 flex flex-col h-[calc(100vh-200px)] min-h-[600px] bg-[#0d1424] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
                    
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-br from-blue-600/10 to-transparent border-b border-slate-800 relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group">
                                    <Brain size={20} className="text-white group-hover:scale-110 transition-transform" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Astra AI</h2>
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                            <Sparkles size={8} className="text-blue-400" />
                                            <span className="text-[8px] font-bold text-blue-400 uppercase">Neural</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                                            <ImageIcon size={8} className="text-purple-400" />
                                            <span className="text-[8px] font-bold text-purple-400 uppercase">Visual Intel</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">Querying your current intelligence library</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer">
                                <Info size={16} className="text-slate-500" />
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
                        <AnimatePresence mode="wait">
                            {!aiResult && !loading && !aiError && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center py-12"
                                >
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center mb-6">
                                        <Brain size={32} className="text-slate-700" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-200 mb-2">Awaiting Intelligence</h4>
                                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                                        Upload your case files and ask questions here. Astra uses Retrieval-Augmented Generation to surface facts buried in your reports.
                                    </p>
                                </motion.div>
                            )}

                            {loading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center py-20"
                                >
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                        <Loader2 size={40} className="text-blue-400 animate-spin relative z-10" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <span className="text-sm font-bold text-blue-400 block tracking-widest uppercase">Consulting Neural Library</span>
                                        <div className="flex gap-1 justify-center">
                                            {[0,1,2].map(i => (
                                                <motion.div 
                                                    key={i}
                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                    className="w-1 h-1 rounded-full bg-blue-400"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {aiError && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                            <ShieldAlert size={18} />
                                        </div>
                                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">Protocol Failure</span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">{aiError}</p>
                                    <button 
                                        onClick={askAI}
                                        className="mt-4 text-[10px] font-black uppercase text-red-400 hover:text-red-300 underline underline-offset-4"
                                    >
                                        Attempt Re-handshake
                                    </button>
                                </motion.div>
                            )}

                            {aiResult && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Answer Card */}
                                    <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20 shadow-lg shadow-blue-500/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <Sparkles size={16} className="text-blue-400" />
                                        </div>
                                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                            Intel Brief
                                        </div>
                                        <div className="text-sm font-medium text-slate-200 leading-relaxed whitespace-pre-wrap">
                                            {aiResult.answer}
                                        </div>
                                    </div>

                                    {/* Sources */}
                                    {aiResult.sources && aiResult.sources.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Retrieved Assets</div>
                                            <div className="flex flex-wrap gap-2">
                                                {aiResult.sources.map((src, i) => (
                                                    <div 
                                                        key={i}
                                                        className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-2 text-[10px] font-bold text-slate-300 hover:border-blue-500/50 hover:bg-slate-700 transition-all cursor-default"
                                                    >
                                                        <FileText size={12} className="text-slate-500" />
                                                        {src}
                                                        <ExternalLink size={10} className="text-slate-600" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setAiResult(null); setAiError(null); }}
                                        className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1 mt-4"
                                    >
                                        <ChevronRight size={10} className="rotate-180" /> Clear Intelligence
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Input Area */}
                    <div className="p-6 bg-slate-900/60 border-t border-slate-800 relative z-10">
                        <div className="relative">
                            <input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && askAI()}
                                placeholder="Query the evidence index..."
                                disabled={loading}
                                className="w-full pl-6 pr-14 py-4 bg-slate-800/80 border border-slate-700 focus:border-blue-500/50 focus:bg-slate-800 rounded-2xl text-sm font-medium text-slate-200 placeholder-slate-600 transition-all outline-none disabled:opacity-50"
                            />
                            <button
                                onClick={askAI}
                                disabled={loading || !question.trim()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all disabled:opacity-30 shadow-lg shadow-blue-900/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Helpful Hints/Status - Integrated into sticky panel */}
                    <div className="p-4 border-t border-slate-800/50 bg-slate-900/20 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <Info size={14} />
                        </div>
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol Hint</div>
                            <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                                AIs context window is grounded in your library. Complex queries regarding financial ties yield higher sig clusters.
                            </p>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #263144;
        }
      `}</style>
    </>
  );
}
