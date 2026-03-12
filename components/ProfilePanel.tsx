"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Bell, LogOut, ChevronRight, Settings, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getPendingInvitations, acceptInvitation, rejectInvitation } from "@/app/actions/case";

interface ProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
}

export default function ProfilePanel({ isOpen, onClose, user }: ProfilePanelProps) {
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loadingInvites, setLoadingInvites] = useState(false);

    useEffect(() => {
        if (isOpen && user?.id) {
            loadInvitations();
        }
    }, [isOpen, user?.id]);

    const loadInvitations = async () => {
        setLoadingInvites(true);
        try {
            const pending = await getPendingInvitations(user.id);
            setInvitations(pending);
        } catch (e) {
            console.error("Failed to load invitations", e);
        } finally {
            setLoadingInvites(false);
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await acceptInvitation(id);
            await loadInvitations();
            window.location.reload(); // Reload to show the new case in the sidebar
        } catch (e) {
            console.error("Failed to accept", e);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectInvitation(id);
            await loadInvitations();
        } catch (e) {
            console.error("Failed to reject", e);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={onClose} 
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed top-14 right-6 z-[9999] w-80 bg-[#0d1424]/95 backdrop-blur-xl border border-[#1e3a5f]/50 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#1e3a5f]/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-blue-500/20">
                                    {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate leading-tight">{user.name}</h3>
                                    <p className="text-xs text-slate-400 truncate mt-1 flex items-center gap-1.5">
                                        <Mail size={12} className="text-blue-400" />
                                        {user.email}
                                    </p>
                                    <div className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                        Special Agent
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2">
                            {/* Invitations Section */}
                            {invitations.length > 0 && (
                                <div className="mb-2">
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                            <Bell size={12} />
                                            Pending Clearances
                                        </div>
                                        <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                            {invitations.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {invitations.map((inv) => (
                                            <div key={inv.id} className="mx-2 p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                                <div>
                                                    <p className="text-xs font-bold text-white truncate">{inv.case.title}</p>
                                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                        From: {inv.inviter.name || inv.inviter.email}
                                                    </p>
                                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">
                                                        Role: {inv.role}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleAccept(inv.id)}
                                                        className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <Check size={12} /> Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(inv.id)}
                                                        className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <X size={12} /> Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-px bg-[#1e3a5f]/20 my-3 mx-4" />
                                </div>
                            )}

                            {/* Menu Items */}
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-3">Account Settings</div>
                            
                            <ProfileMenuItem 
                                icon={<User size={16} />} 
                                label="Personal Profile" 
                                description="Adjust your investigator details"
                            />
                            <ProfileMenuItem 
                                icon={<Shield size={16} />} 
                                label="Security" 
                                description="Keys & authentication"
                            />
                            <ProfileMenuItem 
                                icon={<Settings size={16} />} 
                                label="System Preferences" 
                                description="UI & region settings"
                            />

                            <div className="h-px bg-[#1e3a5f]/20 my-2 mx-4" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                    <LogOut size={16} />
                                </div>
                                <span className="text-sm font-semibold">Terminate Session</span>
                                <ChevronRight size={14} className="ml-auto text-red-500/40" />
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-black/20 border-t border-[#1e3a5f]/20 shrink-0">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>BUILD v1.0.4-BETA</span>
                                <span className="text-blue-500/60 font-bold">CORE ACCESS</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function ProfileMenuItem({ icon, label, description, badge }: { icon: React.ReactNode, label: string, description: string, badge?: string }) {
    return (
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left group">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{label}</span>
                    {badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{description}</p>
            </div>
            <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
        </button>
    );
}
