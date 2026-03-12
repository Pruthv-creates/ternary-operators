"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Bell, Loader2, User, FileText, Shield, ArrowRight } from "lucide-react";
import { useInvitations } from "@/hooks/useInvitations";

interface InvitationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function InvitationWizard({ isOpen, onClose, userId }: InvitationWizardProps) {
    const { invitations, loading, actionId, handleAccept, handleReject } = useInvitations(userId, isOpen);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Wrapper */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="pointer-events-auto w-full max-w-xl bg-[#0a0f1c] border border-[#1e3a5f]/40 rounded-3xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] overflow-hidden"
                        >
                        {/* Header */}
                        <div className="relative h-32 flex items-center px-8 border-b border-[#1e3a5f]/30">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent" />
                            <div className="relative flex items-center gap-5 w-full">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                                    <Bell size={24} className="text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-white tracking-tight">Access Requests</h2>
                                    <p className="text-[11px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Pending Clearance Approvals</p>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar font-sans">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 size={32} className="text-blue-500 animate-spin" />
                                    <p className="text-xs text-slate-500 font-mono tracking-widest uppercase animate-pulse">Scanning Secure Channels...</p>
                                </div>
                            ) : invitations.length > 0 ? (
                                <div className="space-y-4">
                                    {invitations.map((inv) => (
                                        <motion.div
                                            key={inv.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="group relative bg-[#111827] border border-[#1e3a5f]/40 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                                            {inv.role} CLEARANCE
                                                        </div>
                                                        <span className="text-[9px] text-slate-600 font-mono italic">#{inv.id.substring(0,8)}</span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                                                        <FileText size={14} className="text-slate-500" />
                                                        {inv.case.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 py-1 text-[11px] text-slate-400">
                                                            <User size={12} className="text-blue-500" />
                                                            <span className="text-slate-300 font-medium">{inv.inviter.name || inv.inviter.email}</span>
                                                            <span className="text-slate-600 px-1">•</span>
                                                            <span className="italic opacity-60">Inviting Agent</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleAccept(inv.id)}
                                                        disabled={!!actionId}
                                                        className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                                                    >
                                                        {actionId === inv.id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <><Check size={14} /> Accept Access</>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(inv.id)}
                                                        disabled={!!actionId}
                                                        className="h-10 px-6 rounded-xl bg-[#1e293b] hover:bg-[#263144] border border-[#334155] text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <X size={14} /> Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700">
                                        <Shield size={32} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">No Pending Requests</p>
                                        <p className="text-xs text-slate-500 mt-1">Your secure queue is currently empty.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gradient-to-t from-blue-500/[0.02] to-transparent border-t border-[#1e3a5f]/20">
                            <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono">
                                <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    CHANNEL SECURE
                                </span>
                                <button 
                                    onClick={onClose}
                                    className="px-3 py-1 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 group"
                                >
                                    Dismiss <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
