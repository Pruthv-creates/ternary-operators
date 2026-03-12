"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Loader2, X, CheckCircle2, Search, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { inviteCollaboratorById, searchAgents } from "@/app/actions/case";
import { useInvestigationStore } from "@/store/investigationStore";
import { supabase } from "@/lib/supabase";

interface Agent {
    id: string;
    name: string | null;
    email: string;
}

export default function CollaboratorInvite() {
    const { currentCaseId } = useInvestigationStore();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Agent[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<Agent | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setCurrentUserId(data.user.id);
        });
    }, []);

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        setSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const found = await searchAgents(query, currentUserId || "");
                setResults(found);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    }, [query, currentUserId]);

    const handleInvite = async () => {
        if (!currentCaseId || !selected) return;
        setStatus("loading");
        try {
            await inviteCollaboratorById(currentCaseId, selected.id);
            setStatus("success");
        } catch (e: any) {
            setStatus("error");
            setErrorMsg(e.message || "Failed to add collaborator.");
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setSelected(null);
        setStatus("idle");
        setErrorMsg("");
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-900/20"
            >
                <UserPlus size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Invite</span>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
                            onClick={handleClose}
                        />

                        {/* Modal Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[480px] bg-[#0d1424] border border-[#1e3a5f]/60 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e3a5f]/40 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <UserPlus size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white tracking-wide">Add Investigator</h2>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                            {currentCaseId ? "Grant Intel Clearance" : "⚠ Select a case first"}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {status === "success" ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <CheckCircle2 size={56} className="text-emerald-500" />
                                    </motion.div>
                                    <div className="text-center">
                                        <p className="text-base font-bold text-white">Agent Cleared</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            <span className="text-emerald-400 font-semibold">{selected?.name || selected?.email}</span> now has access to this case.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="mt-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <div className="p-6 space-y-5">
                                    {/* Search Box */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Search Agent by Name</label>
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                autoFocus
                                                type="text"
                                                value={query}
                                                onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                                                placeholder="Type agent name or email..."
                                                className="w-full pl-9 pr-4 py-3 bg-[#1e293b] border border-[#1e3a5f]/60 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            />
                                            {searching && (
                                                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Search Results */}
                                    <AnimatePresence>
                                        {results.length > 0 && !selected && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="space-y-1 max-h-52 overflow-y-auto rounded-xl border border-[#1e3a5f]/40 bg-[#0a0f1c]/60 p-1"
                                            >
                                                {results.map((agent) => (
                                                    <button
                                                        key={agent.id}
                                                        onClick={() => { setSelected(agent); setQuery(agent.name || agent.email); setResults([]); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent text-left transition-all group"
                                                    >
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                                            {(agent.name || agent.email)[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">{agent.name || "Unknown"}</p>
                                                            <p className="text-[11px] text-slate-500 truncate">{agent.email}</p>
                                                        </div>
                                                        <div className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-bold uppercase tracking-widest group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all flex-shrink-0">
                                                            Agent
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {query.length > 1 && results.length === 0 && !searching && !selected && (
                                        <div className="flex flex-col items-center gap-2 py-6 text-center">
                                            <User size={28} className="text-slate-600" />
                                            <p className="text-xs text-slate-500">No agents found for <span className="text-slate-300">&quot;{query}&quot;</span></p>
                                            <p className="text-[10px] text-slate-600">They must have signed up first.</p>
                                        </div>
                                    )}

                                    {/* Selected Agent Card */}
                                    <AnimatePresence>
                                        {selected && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                                                    {(selected.name || selected.email)[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white">{selected.name || "Agent"}</p>
                                                    <p className="text-xs text-slate-400 truncate">{selected.email}</p>
                                                </div>
                                                <button onClick={() => { setSelected(null); setQuery(""); }} className="text-slate-500 hover:text-white p-1">
                                                    <X size={14} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {status === "error" && (
                                        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                                            <Shield size={14} />
                                            {errorMsg}
                                        </div>
                                    )}

                                    {/* Footer Actions */}
                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            onClick={handleClose}
                                            className="flex-1 py-2.5 rounded-xl border border-[#1e3a5f]/50 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleInvite}
                                            disabled={!selected || !currentCaseId || status === "loading"}
                                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            {status === "loading" ? (
                                                <><Loader2 size={14} className="animate-spin" /> Granting Access...</>
                                            ) : (
                                                <><UserPlus size={14} /> Grant Intel Clearance</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
