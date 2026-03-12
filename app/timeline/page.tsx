"use client";

import {
    Filter,
    ArrowUpRight,
    Zap,
    Database,
    ChevronDown,
    Plus,
    History,
    Loader2,
    AlertTriangle,
    DollarSign,
    MapPin,
    Radio,
    FileText,
    X,
    Search,
    Link2,
    Calendar,
    ChevronRight,
    Sparkles,
    RefreshCw,
    Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useInvestigationStore } from "@/store/investigationStore";
import { timelineEvents as staticEvents } from "@/lib/data";

// ─── Types ─────────────────────────────────────────────────────────────────
interface TimelineEvent {
    id?: string | number;
    date: string;
    title: string;
    description: string;
    type: string;
    category: string;
    confidence: number;
    status?: string;
    evidenceLinks?: string[];
    entities?: string[];
    isManual?: boolean;
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
    Travel:     { color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  icon: MapPin,        label: "Travel" },
    Financial:  { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: DollarSign,    label: "Financial" },
    Comm:       { color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    icon: Radio,         label: "Comm Intel" },
    Intel:      { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   icon: Sparkles,      label: "Intel" },
    Action:     { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: AlertTriangle, label: "Action" },
    alert:      { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: AlertTriangle, label: "Alert" },
    milestone:  { color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30",    icon: FileText,      label: "Milestone" },
    appointment:{ color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  icon: MapPin,        label: "Appointment" },
    transfer:   { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: DollarSign,    label: "Transfer" },
};

function getTypeConfig(type: string) {
    return TYPE_CONFIG[type] ?? {
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        icon: FileText,
        label: type,
    };
}

// Static events from lib/data adapted into our shape
const STATIC_FALLBACK: TimelineEvent[] = staticEvents.map(e => ({
    id: e.id,
    date: e.date,
    title: e.label,
    description: e.description,
    type: e.type,
    category: e.type === "alert" ? "Direct" : e.type === "milestone" ? "Network" : "Location",
    confidence: e.type === "alert" ? 88 : e.type === "milestone" ? 75 : 92,
    evidenceLinks: [],
    entities: [],
}));

// ─── Manual Entry Modal ─────────────────────────────────────────────────────
function AddEventModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: TimelineEvent) => void }) {
    const [form, setForm] = useState({
        date: "",
        title: "",
        description: "",
        type: "Intel",
        category: "Direct",
        confidence: 70,
        entities: "",
        evidenceLinks: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.date || !form.title) return;
        onAdd({
            id: `manual-${Date.now()}`,
            date: form.date,
            title: form.title.toUpperCase(),
            description: form.description,
            type: form.type,
            category: form.category,
            confidence: form.confidence,
            entities: form.entities.split(",").map(s => s.trim()).filter(Boolean),
            evidenceLinks: form.evidenceLinks.split(",").map(s => s.trim()).filter(Boolean),
            isManual: true,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
            <div
                className="w-[540px] bg-[#0d1424] border border-[#1e3a5f]/60 rounded-3xl shadow-2xl shadow-blue-900/30 p-8 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Glow */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Plus size={16} className="text-blue-400" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">New Manual Entry</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">Add an investigator-sourced event to the case timeline.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                        <X size={14} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Event Title *</label>
                            <input
                                required
                                value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. VOLKOV MEETING LONDON"
                                className="w-full bg-[#0a0f1c] border border-[#1e3a5f]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Date *</label>
                            <input
                                required
                                type="date"
                                value={form.date}
                                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                className="w-full bg-[#0a0f1c] border border-[#1e3a5f]/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Event Type</label>
                            <select
                                value={form.type}
                                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                className="w-full bg-[#0a0f1c] border border-[#1e3a5f]/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                                {["Travel", "Financial", "Comm", "Intel", "Action", "milestone", "alert"].map(t => (
                                    <option key={t} value={t}>{getTypeConfig(t).label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Description</label>
                            <textarea
                                rows={2}
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Brief operational description..."
                                className="w-full bg-[#0a0f1c] border border-[#1e3a5f]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                Confidence: <span className="text-blue-400">{form.confidence}%</span>
                            </label>
                            <input
                                type="range" min={0} max={100}
                                value={form.confidence}
                                onChange={e => setForm(p => ({ ...p, confidence: +e.target.value }))}
                                className="w-full accent-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Category</label>
                            <select
                                value={form.category}
                                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                className="w-full bg-[#0a0f1c] border border-[#1e3a5f]/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                                {["Direct", "Location", "Network", "Bank"].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                <Link2 size={9} className="inline mr-1" />Entities (comma-separated)
                            </label>
                            <input
                                value={form.entities}
                                onChange={e => setForm(p => ({ ...p, entities: e.target.value }))}
                                placeholder="Volkov, Synergy Corp..."
                                className="w-full bg-[#0a0f1c] border border-[#1e3a5f]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Evidence Refs</label>
                            <input
                                value={form.evidenceLinks}
                                onChange={e => setForm(p => ({ ...p, evidenceLinks: e.target.value }))}
                                placeholder="Financial Records Q4..."
                                className="w-full bg-[#0a0f1c] border border-[#1e3a5f]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-slate-400 hover:bg-white/10 transition-all uppercase tracking-widest">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-black text-white transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Plus size={14} />
                            Add Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Event Detail Panel ─────────────────────────────────────────────────────
function EventDetail({ event, onClose }: { event: TimelineEvent; onClose: () => void }) {
    const cfg = getTypeConfig(event.type);
    const Icon = cfg.icon;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className={cn("p-5 border-b border-[#1e3a5f]/40", cfg.bg)}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0", cfg.bg, cfg.border)}>
                            <Icon size={16} className={cfg.color} />
                        </div>
                        <div>
                            <div className={cn("text-[9px] font-black uppercase tracking-widest mb-1", cfg.color)}>{cfg.label}</div>
                            <h3 className="text-xs font-black text-white uppercase tracking-tight leading-tight">{event.title}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all flex-shrink-0">
                        <X size={12} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {/* Date & Confidence */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] border border-[#1e3a5f]/30 rounded-xl p-3">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Date</div>
                        <div className="text-xs font-bold text-white font-mono">{event.date}</div>
                    </div>
                    <div className="bg-white/[0.03] border border-[#1e3a5f]/30 rounded-xl p-3">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Confidence</div>
                        <div className={cn("text-xs font-black", event.confidence >= 80 ? "text-emerald-400" : event.confidence >= 50 ? "text-amber-400" : "text-red-400")}>
                            {event.confidence}%
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] border border-[#1e3a5f]/20 rounded-xl p-3">
                        {event.description || "No description available."}
                    </p>
                </div>

                {/* Category */}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Category:</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/50 text-[9px] font-black text-slate-300 uppercase tracking-widest">{event.category}</span>
                    {event.isManual && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[9px] font-black text-amber-400 uppercase tracking-widest">Manual Entry</span>
                    )}
                </div>

                {/* Entities */}
                {event.entities && event.entities.length > 0 && (
                    <div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Linked Entities</div>
                        <div className="flex flex-wrap gap-1.5">
                            {event.entities.map((ent, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-300">
                                    {ent}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Evidence Links */}
                {event.evidenceLinks && event.evidenceLinks.length > 0 && (
                    <div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Evidence References</div>
                        <div className="space-y-1.5">
                            {event.evidenceLinks.map((ev, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-[#1e3a5f]/30">
                                    <FileText size={11} className="text-slate-500" />
                                    <span className="text-[10px] font-bold text-slate-300">{ev}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Confidence bar */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Intel Certainty</div>
                        <span className="text-[9px] font-black text-slate-400">{event.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000", event.confidence >= 80 ? "bg-emerald-500" : event.confidence >= 50 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${event.confidence}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function TimelinePage() {
    const { currentCaseId } = useInvestigationStore();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterType, setFilterType] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [aiReconstructed, setAiReconstructed] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Load AI timeline or fallback to static
    const fetchTimeline = async () => {
        if (!currentCaseId) {
            setEvents(STATIC_FALLBACK);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/ai/timeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caseId: currentCaseId }),
            });
            const data = await res.json();
            if (data.events && data.events.length > 0) {
                const sorted = (data.events as TimelineEvent[]).sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                setEvents(sorted);
                setAiReconstructed(true);
                if (sorted.length > 0) setSelectedEvent(sorted[0]);
            } else {
                setEvents(STATIC_FALLBACK);
                if (STATIC_FALLBACK.length > 0) setSelectedEvent(STATIC_FALLBACK[0]);
            }
        } catch {
            setEvents(STATIC_FALLBACK);
            if (STATIC_FALLBACK.length > 0) setSelectedEvent(STATIC_FALLBACK[0]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCaseId]);

    // Close filter menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setShowFilterMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleAddEvent = (event: TimelineEvent) => {
        const updated = [...events, event].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setEvents(updated);
        setSelectedEvent(event);
    };

    const allTypes = ["All", ...Array.from(new Set(events.map(e => e.type)))];

    const filteredEvents = events.filter(e => {
        const matchType = filterType === "All" || e.type === filterType;
        const matchSearch = !searchQuery ||
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.entities || []).some(en => en.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchType && matchSearch;
    });

    // Compute year groups for the scrubber
    const years = Array.from(new Set(filteredEvents.map(e => {
        try { return new Date(e.date).getFullYear().toString(); } catch { return "—"; }
    })));

    // Stats
    const typeCounts = allTypes.slice(1).reduce((acc, t) => {
        acc[t] = events.filter(e => e.type === t).length;
        return acc;
    }, {} as Record<string, number>);

    return (
        <>
            {/* ── Add Event Modal ─────────────────────────────────────── */}
            {showAddModal && (
                <AddEventModal onClose={() => setShowAddModal(false)} onAdd={handleAddEvent} />
            )}

            <main className="flex-1 overflow-hidden flex flex-col h-full bg-[#080d18] relative">
                {/* Ambient background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-48 bg-blue-500/5 blur-3xl rounded-full" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-40 bg-violet-500/5 blur-3xl rounded-full" />
                    <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(90deg,#1e3a5f_1px,transparent_1px),linear-gradient(#1e3a5f_1px,transparent_1px)] [background-size:48px_48px]" />
                </div>

                <div className="flex flex-col flex-1 min-h-0 p-6 gap-5 relative z-10">
                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="flex items-center justify-between flex-shrink-0">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <Clock size={15} className="text-blue-400" />
                                </div>
                                <h1 className="text-2xl font-black text-white tracking-tight">Timeline Engine</h1>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest",
                                    loading
                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                        : aiReconstructed
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                            : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                )}>
                                    {loading ? "Analyzing..." : aiReconstructed ? "AI Reconstructed" : "Static View"}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium tracking-wide ml-11">
                                {loading
                                    ? "Reconstructing chronological sequences from case intelligence..."
                                    : `${filteredEvents.length} events across ${years.length} period${years.length !== 1 ? "s" : ""} · Case: ${currentCaseId ? "VANGUARD OMEGA" : "Demo Mode"}`}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1424] border border-[#1e3a5f]/40 rounded-xl w-44">
                                <Search size={12} className="text-slate-600 flex-shrink-0" />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search events..."
                                    className="bg-transparent text-[11px] text-slate-300 placeholder-slate-700 focus:outline-none w-full font-medium"
                                />
                            </div>

                            {/* Filter dropdown */}
                            <div className="relative" ref={filterRef}>
                                <button
                                    onClick={() => setShowFilterMenu(p => !p)}
                                    className="flex items-center gap-2 px-3 py-2 bg-[#0d1424] border border-[#1e3a5f]/40 rounded-xl hover:border-blue-500/40 transition-all"
                                >
                                    <Filter size={12} className="text-slate-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {filterType === "All" ? "All Types" : getTypeConfig(filterType).label}
                                    </span>
                                    <ChevronDown size={12} className="text-slate-600" />
                                </button>
                                {showFilterMenu && (
                                    <div className="absolute right-0 top-full mt-2 bg-[#0d1424] border border-[#1e3a5f]/50 rounded-2xl shadow-2xl overflow-hidden z-30 min-w-[160px]">
                                        {allTypes.map(t => {
                                            const cfg = t === "All" ? null : getTypeConfig(t);
                                            return (
                                                <button
                                                    key={t}
                                                    onClick={() => { setFilterType(t); setShowFilterMenu(false); }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-white/5 transition-colors",
                                                        filterType === t ? "bg-blue-500/10" : ""
                                                    )}
                                                >
                                                    {cfg && <cfg.icon size={11} className={cfg.color} />}
                                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", filterType === t ? "text-white" : "text-slate-400")}>
                                                        {t === "All" ? "All Types" : cfg?.label}
                                                    </span>
                                                    {t !== "All" && (
                                                        <span className="ml-auto text-[9px] font-bold text-slate-600">{typeCounts[t] || 0}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Reconstruct */}
                            <button
                                onClick={fetchTimeline}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0d1424] border border-[#1e3a5f]/40 rounded-xl hover:border-blue-500/40 transition-all disabled:opacity-40"
                            >
                                <RefreshCw size={12} className={cn("text-slate-400", loading && "animate-spin")} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reconstruct</span>
                            </button>

                            {/* Add event */}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black text-white transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest flex items-center gap-2"
                            >
                                <Plus size={14} />
                                New Entry
                            </button>
                        </div>
                    </div>

                    {/* ── Stats Strip ────────────────────────────────────── */}
                    <div className="flex gap-3 flex-shrink-0">
                        {[
                            { label: "Total Events", value: events.length, color: "text-white" },
                            { label: "Filtered", value: filteredEvents.length, color: "text-blue-400" },
                            { label: "Manual", value: events.filter(e => e.isManual).length, color: "text-amber-400" },
                            { label: "Avg Confidence", value: events.length ? `${Math.round(events.reduce((s, e) => s + e.confidence, 0) / events.length)}%` : "—", color: "text-emerald-400" },
                        ].map(stat => (
                            <div key={stat.label} className="flex-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{stat.label}</div>
                                <div className={cn("text-lg font-black", stat.color)}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Main Content ────────────────────────────────────── */}
                    <div className="flex-1 flex gap-5 min-h-0">

                        {/* ── Left: Vertical Timeline ───────────────────── */}
                        <div className="flex-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm relative">
                            {loading && (
                                <div className="absolute inset-0 bg-[#0d1424]/90 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-60" />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] animate-pulse mb-1">Neural Temporal Analysis</div>
                                        <p className="text-[9px] text-slate-600 font-medium">AI is reading all case evidence...</p>
                                    </div>
                                </div>
                            )}

                            {/* Panel Header */}
                            <div className="px-6 py-4 border-b border-[#1e3a5f]/40 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <Calendar size={14} className="text-blue-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Chronological Reconstruction</h3>
                                    <span className="text-[9px] font-black text-slate-600">{filteredEvents.length} events</span>
                                </div>
                                {/* Legend */}
                                <div className="flex items-center gap-4">
                                    {[
                                        { type: "Financial", cfg: getTypeConfig("Financial") },
                                        { type: "Travel", cfg: getTypeConfig("Travel") },
                                        { type: "Action", cfg: getTypeConfig("Action") },
                                        { type: "Intel", cfg: getTypeConfig("Intel") },
                                    ].map(({ type, cfg }) => (
                                        <div key={type} className="flex items-center gap-1">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", cfg.color.replace("text-", "bg-"))} />
                                            <span className="text-[8px] font-bold text-slate-600 uppercase">{cfg.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Events scroll zone */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {filteredEvents.length === 0 && !loading ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                        <History size={40} className="mb-4 text-slate-600" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Events Found</p>
                                        <p className="text-[10px] text-slate-600 mt-2 max-w-[200px]">
                                            {searchQuery || filterType !== "All"
                                                ? "Try adjusting your filters or search query."
                                                : "Upload evidence files to allow AI to reconstruct the timeline."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Central spine line */}
                                        <div className="absolute left-[23px] top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-[#1e3a5f] to-transparent" />

                                        <div className="space-y-2">
                                            {filteredEvents.map((event, idx) => {
                                                const cfg = getTypeConfig(event.type);
                                                const Icon = cfg.icon;
                                                const isSelected = selectedEvent?.id === event.id ||
                                                    (selectedEvent?.date === event.date && selectedEvent?.title === event.title);
                                                const isFirst = idx === 0;
                                                const isLast = idx === filteredEvents.length - 1;

                                                // Show year divider
                                                const thisYear = (() => { try { return new Date(event.date).getFullYear(); } catch { return null; } })();
                                                const prevYear = idx > 0 ? (() => { try { return new Date(filteredEvents[idx - 1].date).getFullYear(); } catch { return null; } })() : null;
                                                const showYearDivider = thisYear && (idx === 0 || thisYear !== prevYear);

                                                return (
                                                    <div key={`${event.id ?? idx}`}>
                                                        {showYearDivider && (
                                                            <div className="flex items-center gap-3 py-3 pl-12">
                                                                <div className="h-px flex-1 bg-[#1e3a5f]/30" />
                                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{thisYear}</span>
                                                                <div className="h-px flex-1 bg-[#1e3a5f]/30" />
                                                            </div>
                                                        )}

                                                        <div
                                                            onClick={() => setSelectedEvent(event)}
                                                            className={cn(
                                                                "group flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative",
                                                                isSelected
                                                                    ? cn("border-opacity-60", cfg.border, cfg.bg)
                                                                    : "border-transparent hover:bg-white/[0.03] hover:border-[#1e3a5f]/30"
                                                            )}
                                                        >
                                                            {/* Timeline dot */}
                                                            <div className="flex-shrink-0 relative z-10">
                                                                <div className={cn(
                                                                    "w-[46px] h-[46px] rounded-xl border flex items-center justify-center transition-all duration-200",
                                                                    isSelected ? cn(cfg.bg, cfg.border) : "bg-[#0a0f1c] border-[#1e3a5f]/30 group-hover:border-[#1e3a5f]/50"
                                                                )}>
                                                                    <Icon size={18} className={isSelected ? cfg.color : "text-slate-600 group-hover:text-slate-400"} />
                                                                </div>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", isSelected ? cfg.color : "text-slate-600")}>
                                                                        {event.date}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {event.isManual && (
                                                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[7px] font-black uppercase tracking-widest">Manual</span>
                                                                        )}
                                                                        <div className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", cfg.bg, cfg.color)}>
                                                                            {cfg.label}
                                                                        </div>
                                                                        <ChevronRight size={12} className={cn("transition-transform", isSelected ? cn(cfg.color, "rotate-90") : "text-slate-700 group-hover:text-slate-500")} />
                                                                    </div>
                                                                </div>

                                                                <div className={cn(
                                                                    "text-[12px] font-black uppercase tracking-tight mb-1 transition-colors",
                                                                    isSelected ? "text-white" : "text-slate-300 group-hover:text-slate-200"
                                                                )}>
                                                                    {event.title}
                                                                </div>

                                                                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-1 mb-2">
                                                                    {event.description}
                                                                </p>

                                                                <div className="flex items-center gap-3">
                                                                    {/* Confidence bar */}
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={cn(
                                                                                    "h-full rounded-full",
                                                                                    event.confidence >= 80 ? "bg-emerald-500" :
                                                                                    event.confidence >= 50 ? "bg-amber-500" : "bg-red-500"
                                                                                )}
                                                                                style={{ width: `${event.confidence}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[9px] font-bold text-slate-600 w-6 shrink-0">{event.confidence}%</span>
                                                                    </div>
                                                                    {/* Category */}
                                                                    <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">{event.category}</span>
                                                                    {/* Entities count */}
                                                                    {event.entities && event.entities.length > 0 && (
                                                                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                                                                            <Link2 size={8} /> {event.entities.length}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Right: Detail + Controls ──────────────────── */}
                        <div className="w-[360px] flex flex-col gap-4">

                            {/* Event Detail Panel */}
                            <div className="flex-1 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl overflow-hidden backdrop-blur-sm">
                                {selectedEvent ? (
                                    <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                                            <FileText size={20} className="text-blue-400" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">No Event Selected</p>
                                        <p className="text-[10px] text-slate-600">Click any event in the timeline to inspect its evidence links, entities, and intelligence certainty.</p>
                                    </div>
                                )}
                            </div>

                            {/* Temporal Synthesis Panel */}
                            <div className="bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-3xl p-5 backdrop-blur-sm">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Zap size={16} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">Temporal Synthesis</div>
                                        <p className="text-[9px] text-slate-500 leading-tight">AI-reconstructed sequence from case documents and evidence vault.</p>
                                    </div>
                                </div>

                                {/* Type breakdown */}
                                <div className="space-y-2 mb-4">
                                    {Object.entries(typeCounts).slice(0, 5).map(([type, count]) => {
                                        const cfg = getTypeConfig(type);
                                        const pct = events.length > 0 ? Math.round((count / events.length) * 100) : 0;
                                        return (
                                            <div key={type} className="flex items-center gap-2">
                                                <cfg.icon size={10} className={cfg.color} />
                                                <span className="text-[9px] font-bold text-slate-500 uppercase w-16 shrink-0">{cfg.label}</span>
                                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div className={cn("h-full rounded-full", cfg.color.replace("text-", "bg-"))} style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-600 w-5 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
                                >
                                    <Plus size={14} />
                                    Add Manual Event
                                </button>
                            </div>

                            {/* Status bar */}
                            <div className="h-16 bg-[#0d1424]/60 border border-[#1e3a5f]/30 rounded-2xl px-5 flex items-center gap-3 backdrop-blur-sm">
                                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Temporal Intelligence</div>
                                    <div className="text-[10px] font-bold text-slate-300 truncate">
                                        {loading
                                            ? "Reconstructing from AI..."
                                            : aiReconstructed
                                                ? `AI Analysis · Synced ${new Date().toLocaleTimeString()}`
                                                : `Static Data · ${new Date().toLocaleTimeString()}`}
                                    </div>
                                </div>
                                <Database size={14} className="text-slate-700 flex-shrink-0" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2a4f7f; }
            `}</style>
        </>
    );
}
