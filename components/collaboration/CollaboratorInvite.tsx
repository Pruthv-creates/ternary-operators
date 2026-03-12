"use client";

import { UserPlus, X, CheckCircle2, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigationStore } from "@/store/investigationStore";
import { useCollaboratorInvite } from "@/hooks/collaboration/useCollaboratorInvite";
import { AgentSearch } from "@/components/collaboration/AgentSearch";
import { AgentResultItem } from "@/components/collaboration/AgentResultItem";

export default function CollaboratorInvite() {
    const { currentCaseId } = useInvestigationStore();
    const {
        isOpen,
        setIsOpen,
        query,
        setQuery,
        results,
        searching,
        selected,
        setSelected,
        status,
        errorMsg,
        handleInvite,
        handleClose
    } = useCollaboratorInvite(currentCaseId);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
                <UserPlus size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline font-sans">Invite</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
                            onClick={handleClose}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[480px] bg-[#0d1424] border border-[#1e3a5f]/60 rounded-2xl shadow-2xl overflow-hidden font-sans"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e3a5f]/40 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <UserPlus size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white tracking-wide">Add Investigator</h2>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                            {currentCaseId ? "Invite to Case" : "⚠ Select a case first"}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {status === "success" ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                                        <CheckCircle2 size={56} className="text-emerald-500" />
                                    </motion.div>
                                    <div className="text-center">
                                        <p className="text-base font-bold text-white">Invitation Sent</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            An invitation has been sent to <span className="text-emerald-400 font-semibold">{selected?.name || selected?.email}</span>.
                                        </p>
                                    </div>
                                    <button onClick={handleClose} className="mt-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors">Done</button>
                                </div>
                            ) : (
                                <div className="p-6 space-y-5">
                                    <AgentSearch query={query} onQueryChange={setQuery} searching={searching} />

                                    <AnimatePresence>
                                        {results.length > 0 && !selected && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="space-y-1 max-h-52 overflow-y-auto rounded-xl border border-[#1e3a5f]/40 bg-[#0a0f1c]/60 p-1 custom-scrollbar"
                                            >
                                                {results.map((agent) => (
                                                    <AgentResultItem 
                                                        key={agent.id} 
                                                        agent={agent} 
                                                        onSelect={(a) => { setSelected(a); setQuery(a.name || a.email); }} 
                                                    />
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

                                    <AnimatePresence>
                                        {selected && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 shadow-inner"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                                                    {(selected.name || selected.email)[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white">{selected.name || "Agent"}</p>
                                                    <p className="text-xs text-slate-400 truncate">{selected.email}</p>
                                                </div>
                                                <button onClick={() => { setSelected(null); setQuery(""); }} className="text-slate-500 hover:text-white p-1 transition-colors">
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

                                    <div className="flex items-center gap-3 pt-1">
                                        <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-[#1e3a5f]/50 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Cancel</button>
                                        <button
                                            onClick={handleInvite}
                                            disabled={!selected || !currentCaseId || status === "loading"}
                                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                                        >
                                            {status === "loading" ? "Sending..." : <><UserPlus size={14} /> Send Invitation</>}
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
