"use client";

import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getUserCases, getCaseGraph, getCaseAuditLogs, getCaseCollaborators } from "@/app/actions/case";
import { useInvestigationStore } from "@/store/investigationStore";
import { useRouter } from "next/navigation";
import {
    Brain, Loader2, AlertTriangle, CheckCircle2, TrendingUp, Users,
    Network, ShieldAlert, Sparkles, ChevronRight, Activity, Clock,
    Target, Link2, Fingerprint, Search, RefreshCcw, BarChart3,
    ArrowRight, Zap, Eye, GitBranch
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CaseItem {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    description?: string | null;
}

interface AnalysisResult {
    overallScore: number;
    grade: string;
    breakdown: {
        dataDensity: number;
        connectivity: number;
        entityDiversity: number;
        evidenceCoverage: number;
    };
    summary: string;
    looseEnds: Array<{ title: string; description: string; severity: "high" | "medium" | "low" }>;
    pointsOfInterest: Array<{ title: string; description: string; type: string }>;
}

interface CaseStats {
    nodeCount: number;
    edgeCount: number;
    collaboratorCount: number;
    recentActivity: string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: string }) {
    const radius = 54;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const gradeColor = grade === "A" ? "#10b981" : grade === "B" ? "#3b82f6" : grade === "C" ? "#f59e0b" : grade === "D" ? "#f97316" : "#ef4444";

    return (
        <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
            <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                <circle
                    stroke="rgba(255,255,255,0.05)"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <motion.circle
                    stroke={gradeColor}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + " " + circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    style={{ filter: `drop-shadow(0 0 8px ${gradeColor}80)` }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <motion.span
                    className="text-3xl font-black text-white tabular-nums"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {score}
                </motion.span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: gradeColor }}>
                    Grade {grade}
                </span>
            </div>
        </div>
    );
}

function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
                <span className="text-[11px] font-black text-slate-300">{value}%</span>
            </div>
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
            </div>
        </div>
    );
}

function SeverityBadge({ severity }: { severity: string }) {
    const cfg = {
        high: { bg: "bg-red-500/10 border-red-500/30 text-red-400", icon: "🔴" },
        medium: { bg: "bg-amber-500/10 border-amber-500/30 text-amber-400", icon: "🟡" },
        low: { bg: "bg-blue-500/10 border-blue-500/30 text-blue-400", icon: "🔵" },
    }[severity] || { bg: "bg-slate-500/10 border-slate-500/30 text-slate-400", icon: "⚪" };

    return (
        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", cfg.bg)}>
            {severity}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
        connection: { color: "text-purple-400 border-purple-500/30 bg-purple-500/10", icon: <Link2 size={10} /> },
        entity: { color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: <Fingerprint size={10} /> },
        financial: { color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: <TrendingUp size={10} /> },
        behavioral: { color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: <Activity size={10} /> },
    };
    const c = cfg[type] || cfg.connection;
    return (
        <span className={cn("flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", c.color)}>
            {c.icon} {type}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const color = status === "ACTIVE" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        : status === "RESOLVED" ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
            : "bg-slate-500/10 border-slate-500/30 text-slate-400";
    return (
        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border", color)}>
            {status}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CasesPage() {
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [caseStats, setCaseStats] = useState<CaseStats | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const { loadCaseData } = useInvestigationStore();
    const router = useRouter();

    // Load user + their cases
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            setLoading(true);
            const userCases = await getUserCases(user.id);
            const serialized = userCases.map(c => ({
                ...c,
                createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
                updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
            })) as CaseItem[];
            setCases(serialized);
            setLoading(false);
            if (serialized.length > 0) {
                setSelectedCase(serialized[0]);
            }
        };
        init();
    }, []);

    // Load case stats + audit logs when selected case changes
    useEffect(() => {
        if (!selectedCase) return;

        const loadStats = async () => {
            const [graph, logs, collab] = await Promise.all([
                getCaseGraph(selectedCase.id),
                getCaseAuditLogs(selectedCase.id),
                getCaseCollaborators(selectedCase.id),
            ]);
            setCaseStats({
                nodeCount: graph.nodes.length,
                edgeCount: graph.edges.length,
                collaboratorCount: collab.length,
                recentActivity: logs.length > 0 ? logs[0].action : "No activity yet",
            });
            setAuditLogs(logs.slice(0, 8));
            setAnalysis(null); // clear old analysis
        };
        loadStats();
    }, [selectedCase]);

    const runAnalysis = useCallback(async () => {
        if (!selectedCase || analyzing) return;
        setAnalyzing(true);
        try {
            const graph = await getCaseGraph(selectedCase.id);
            const res = await fetch("http://localhost:8000/analyze-case", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: selectedCase.title,
                    nodes: graph.nodes,
                    edges: graph.edges,
                }),
                signal: AbortSignal.timeout(90000),
            });
            if (!res.ok) throw new Error("Analysis failed");
            const data = await res.json();
            setAnalysis(data);
        } catch (e) {
            console.error("Analysis error:", e);
        } finally {
            setAnalyzing(false);
        }
    }, [selectedCase, analyzing]);

    const openCase = () => {
        if (!selectedCase) return;
        loadCaseData(selectedCase.id);
        localStorage.setItem("astraeus_last_case_id", selectedCase.id);
        router.push("/");
    };

    const filteredCases = cases.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <main className="flex-1 overflow-hidden flex relative z-10 h-full">
            {/* ── LEFT PANEL: Case List ── */}
            <div className="w-72 shrink-0 border-r border-[#1e3a5f]/30 flex flex-col h-full bg-[#0a0d18]">
                {/* Header */}
                <div className="px-5 pt-6 pb-4 border-b border-[#1e3a5f]/20">
                    <h1 className="text-sm font-black text-white uppercase tracking-widest mb-1">My Cases</h1>
                    <p className="text-[10px] text-slate-500 font-medium">{cases.length} investigation{cases.length !== 1 ? "s" : ""}</p>
                    <div className="relative mt-4">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search cases..."
                            className="w-full pl-8 pr-4 py-2 text-[11px] bg-[#111827] border border-[#1e3a5f]/40 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Cases List */}
                <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center pt-12">
                            <Loader2 size={20} className="animate-spin text-slate-600" />
                        </div>
                    ) : filteredCases.length === 0 ? (
                        <div className="text-center pt-12">
                            <div className="text-slate-700 text-[11px] font-bold uppercase tracking-widest">No cases found</div>
                        </div>
                    ) : (
                        filteredCases.map(c => {
                            const isActive = selectedCase?.id === c.id;
                            return (
                                <motion.div
                                    key={c.id}
                                    whileHover={{ x: 2 }}
                                    onClick={() => setSelectedCase(c)}
                                    className={cn(
                                        "px-4 py-3.5 rounded-xl cursor-pointer transition-all border",
                                        isActive
                                            ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                            : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-[#1e3a5f]/30"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full shrink-0 mt-0.5",
                                                c.status === "ACTIVE" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-slate-600"
                                            )} />
                                            <span className="text-xs font-bold text-white truncate">{c.title}</span>
                                        </div>
                                        {isActive && <ChevronRight size={12} className="text-blue-400 shrink-0 mt-0.5" />}
                                    </div>
                                    <div className="flex items-center justify-between pl-3.5">
                                        <StatusBadge status={c.status} />
                                        <span className="text-[9px] font-mono text-slate-600">{formatDate(c.updatedAt)}</span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {!selectedCase ? (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <div className="w-20 h-20 rounded-3xl bg-[#111827] border border-[#1e3a5f]/30 flex items-center justify-center mx-auto mb-6">
                                <Network size={36} className="text-slate-700" />
                            </div>
                            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-2">Select a Case</h2>
                            <p className="text-[11px] text-slate-500">Choose a case from the sidebar to view intelligence analysis.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 space-y-6">

                        {/* ── CASE HEADER ── */}
                        <motion.div
                            key={selectedCase.id + "-header"}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-[#0d1424] via-[#0f1b35] to-[#0d1424] border border-[#1e3a5f]/40 rounded-2xl p-6 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center">
                                    <Fingerprint size={28} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl font-black text-white tracking-tight">{selectedCase.title}</h1>
                                        <StatusBadge status={selectedCase.status} />
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Created {formatDate(selectedCase.createdAt)} · Last updated {formatDate(selectedCase.updatedAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={runAnalysis}
                                    disabled={analyzing}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40"
                                >
                                    {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                                    {analyzing ? "Analyzing..." : "AI Analysis"}
                                </button>
                                <button
                                    onClick={openCase}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e293b] border border-[#1e3a5f]/60 text-slate-200 hover:bg-[#263144] font-black text-[11px] uppercase tracking-widest transition-all"
                                >
                                    <Eye size={14} className="text-blue-400" />
                                    Open Canvas
                                </button>
                            </div>
                        </motion.div>

                        {/* ── STATS ROW ── */}
                        <motion.div
                            key={selectedCase.id + "-stats"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-4 gap-4"
                        >
                            {[
                                { label: "Entities", value: caseStats?.nodeCount ?? "—", icon: <Target size={16} />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                                { label: "Connections", value: caseStats?.edgeCount ?? "—", icon: <GitBranch size={16} />, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                                { label: "Investigators", value: caseStats?.collaboratorCount ?? "—", icon: <Users size={16} />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                                { label: "Activity Events", value: auditLogs.length, icon: <Activity size={16} />, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-[#0d1424] border border-[#1e3a5f]/30 rounded-2xl p-5">
                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border mb-3", stat.color)}>
                                        {stat.icon}
                                    </div>
                                    <div className="text-2xl font-black text-white tabular-nums">{stat.value}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-0.5">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>

                        {/* ── CONTENT GRID ── */}
                        <div className="grid grid-cols-12 gap-6">

                            {/* ── AI ANALYSIS PANEL ── */}
                            <div className="col-span-7 space-y-5">
                                <AnimatePresence mode="wait">
                                    {!analysis && !analyzing && (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="bg-[#0d1424] border border-[#1e3a5f]/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[280px]"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
                                                <Brain size={32} className="text-indigo-400" />
                                            </div>
                                            <h3 className="text-base font-black text-white uppercase tracking-widest mb-2">Intelligence Analysis</h3>
                                            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mb-6">
                                                Click <strong className="text-indigo-400">AI Analysis</strong> to run a deep scan using LLM + RAG on this case's knowledge graph.
                                            </p>
                                            <button onClick={runAnalysis} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40">
                                                <Sparkles size={14} />
                                                Run Analysis
                                            </button>
                                        </motion.div>
                                    )}

                                    {analyzing && (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="bg-[#0d1424] border border-indigo-500/30 rounded-2xl p-10 flex flex-col items-center justify-center min-h-[280px] shadow-[0_0_40px_rgba(99,102,241,0.1)]"
                                        >
                                            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 flex items-center justify-center mb-5 relative">
                                                <div className="w-full h-full absolute rounded-full border-t-2 border-indigo-500 animate-spin" />
                                                <Brain size={24} className="text-indigo-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Analyzing Case</h3>
                                            <div className="space-y-1 text-center">
                                                {["Loading case graph...", "Scanning RAG evidence...", "Querying LLM (llama3)...", "Generating insights..."].map((s, i) => (
                                                    <motion.p
                                                        key={s}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: i * 0.8 }}
                                                        className="text-[10px] text-slate-500 font-mono"
                                                    >{s}</motion.p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {analysis && !analyzing && (
                                        <motion.div
                                            key="analysis"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-5"
                                        >
                                            {/* Quality Score Card */}
                                            <div className="bg-[#0d1424] border border-[#1e3a5f]/30 rounded-2xl p-6">
                                                <div className="flex items-center gap-3 mb-5">
                                                    <BarChart3 size={16} className="text-blue-400" />
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Intelligence Quality Score</h3>
                                                    <button onClick={runAnalysis} className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-all" title="Re-analyze">
                                                        <RefreshCcw size={12} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <ScoreRing score={analysis.overallScore} grade={analysis.grade} />
                                                    <div className="flex-1 space-y-3.5">
                                                        <BreakdownBar label="Data Density" value={analysis.breakdown.dataDensity} color="#3b82f6" />
                                                        <BreakdownBar label="Connectivity" value={analysis.breakdown.connectivity} color="#8b5cf6" />
                                                        <BreakdownBar label="Entity Diversity" value={analysis.breakdown.entityDiversity} color="#10b981" />
                                                        <BreakdownBar label="Evidence Coverage" value={analysis.breakdown.evidenceCoverage} color="#f59e0b" />
                                                    </div>
                                                </div>
                                                <div className="mt-5 p-4 rounded-xl bg-[#0a0f1c] border border-[#1e3a5f]/20">
                                                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                                        <span className="text-indigo-400 font-bold not-italic">Astra AI:</span> {analysis.summary}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Loose Ends */}
                                            <div className="bg-[#0d1424] border border-[#1e3a5f]/30 rounded-2xl overflow-hidden">
                                                <div className="px-6 py-4 border-b border-[#1e3a5f]/20 bg-red-500/5 flex items-center gap-3">
                                                    <AlertTriangle size={15} className="text-red-400" />
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Loose Ends</h3>
                                                    <span className="ml-auto text-[9px] font-bold text-red-400/60 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                                                        {analysis.looseEnds.length} flagged
                                                    </span>
                                                </div>
                                                <div className="divide-y divide-[#1e3a5f]/20">
                                                    {analysis.looseEnds.length === 0 ? (
                                                        <div className="px-6 py-8 text-center">
                                                            <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-2" />
                                                            <p className="text-[11px] text-slate-500">No loose ends detected. Investigation is well-connected.</p>
                                                        </div>
                                                    ) : analysis.looseEnds.map((le, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.08 }}
                                                            className="px-6 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors group"
                                                        >
                                                            <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                                <ShieldAlert size={12} className="text-red-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[12px] font-bold text-white">{le.title}</span>
                                                                    <SeverityBadge severity={le.severity} />
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 leading-relaxed">{le.description}</p>
                                                            </div>
                                                            <ArrowRight size={12} className="text-slate-700 group-hover:text-slate-500 shrink-0 mt-1 transition-colors" />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Points of Interest */}
                                            <div className="bg-[#0d1424] border border-[#1e3a5f]/30 rounded-2xl overflow-hidden">
                                                <div className="px-6 py-4 border-b border-[#1e3a5f]/20 bg-emerald-500/5 flex items-center gap-3">
                                                    <Sparkles size={15} className="text-emerald-400" />
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Points of Interest</h3>
                                                    <span className="ml-auto text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                                        {analysis.pointsOfInterest.length} leads
                                                    </span>
                                                </div>
                                                <div className="divide-y divide-[#1e3a5f]/20">
                                                    {analysis.pointsOfInterest.length === 0 ? (
                                                        <div className="px-6 py-8 text-center">
                                                            <p className="text-[11px] text-slate-500">No specific leads identified. Expand the investigation graph.</p>
                                                        </div>
                                                    ) : analysis.pointsOfInterest.map((poi, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.08 }}
                                                            className="px-6 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors group"
                                                        >
                                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Zap size={12} className="text-emerald-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[12px] font-bold text-white">{poi.title}</span>
                                                                    <TypeBadge type={poi.type} />
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 leading-relaxed">{poi.description}</p>
                                                            </div>
                                                            <ArrowRight size={12} className="text-slate-700 group-hover:text-slate-500 shrink-0 mt-1 transition-colors" />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* ── RIGHT PANEL: Audit/Activity ── */}
                            <div className="col-span-5 space-y-5">
                                {/* Audit Log */}
                                <div className="bg-[#0d1424] border border-[#1e3a5f]/30 rounded-2xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-[#1e3a5f]/20 flex items-center gap-3">
                                        <Clock size={14} className="text-slate-500" />
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Activity Log</h3>
                                    </div>
                                    <div className="divide-y divide-[#1e3a5f]/10 max-h-80 overflow-y-auto custom-scrollbar">
                                        {auditLogs.length === 0 ? (
                                            <div className="px-5 py-8 text-center text-[11px] text-slate-600">No activity logged yet.</div>
                                        ) : auditLogs.map((log, i) => (
                                            <div key={log.id || i} className="px-5 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-slate-300 leading-snug">
                                                        <span className="text-white font-bold">[{log.user}]</span> {log.action}
                                                    </p>
                                                    <span className="text-[9px] text-slate-600 font-mono">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(log.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Open Investigation CTA */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={openCase}
                                    className="w-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/30 rounded-2xl p-6 flex items-center gap-4 group hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Network size={22} className="text-blue-400" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-sm font-black text-white uppercase tracking-widest mb-0.5">Open Investigation</div>
                                        <div className="text-[10px] text-slate-500">View and edit the knowledge graph canvas</div>
                                    </div>
                                    <ArrowRight size={18} className="text-blue-500/50 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                </motion.button>

                                {/* Description card */}
                                <div className="bg-[#0d1424] border border-[#1e3a5f]/30 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText size={13} className="text-slate-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Case Summary</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        {selectedCase.description || `This is an active investigation titled "${selectedCase.title}". Use the AI Analysis button to surface key insights, loose ends, and points of interest based on your current knowledge graph.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function FileText({ size, className }: { size: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    );
}
