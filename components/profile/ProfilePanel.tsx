"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Bell, LogOut, ChevronRight, Settings } from "lucide-react";
import InvitationWizard from "@/components/profile/InvitationWizard";
import { useProfileLogic } from "@/hooks/profile/useProfileLogic";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileMenuItem } from "@/components/profile/ProfileMenuItem";

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
    const {
        invitations,
        wizardOpen,
        setWizardOpen,
        handleLogout
    } = useProfileLogic(user, isOpen);

    return (
        <>
            <InvitationWizard 
                isOpen={wizardOpen} 
                onClose={() => setWizardOpen(false)} 
                userId={user.id} 
            />
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
                            className="fixed top-14 right-6 z-[9999] w-80 bg-[#0d1424]/95 backdrop-blur-xl border border-[#1e3a5f]/50 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col font-sans"
                        >
                            <ProfileHeader user={user} />

                            <div className="overflow-y-auto flex-1 p-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-3 font-sans">Account Settings</div>
                                
                                <ProfileMenuItem 
                                    icon={<User size={16} />} 
                                    label="Personal Profile" 
                                    description="Adjust your investigator details"
                                />
                                
                                <ProfileMenuItem 
                                    icon={<Bell size={16} />} 
                                    label="Invitations" 
                                    description="Manage collaboration requests"
                                    badge={invitations.length > 0 ? invitations.length.toString() : undefined}
                                    onClick={() => { setWizardOpen(true); onClose(); }}
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
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all group font-sans"
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
        </>
    );
}
