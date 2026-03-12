"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageSquare, Trash2, Radio } from "lucide-react";
import { useState } from "react";
import ProfilePanel from "@/components/profile/ProfilePanel";
import CollaboratorInvite from "@/components/collaboration/CollaboratorInvite";
import ChatSidePanel from "@/components/topbar/ChatSidePanel";
import VoiceCommsOverlay from "@/components/topbar/VoiceCommsOverlay";
import { useInvestigationStore } from "@/store/investigationStore";
import { useTopbarPresence } from "@/hooks/topbar/useTopbarPresence";
import { useCaseActions } from "@/hooks/cases/useCaseActions";
import { TopbarSearch } from "@/components/topbar/TopbarSearch";
import { PresenceIndicator } from "@/components/topbar/PresenceIndicator";
import { UserNav } from "@/components/topbar/UserNav";
import { useChatBackgroundListener } from "@/hooks/chat/useChatBackgroundListener";

export default function Topbar() {
    const { currentCaseId, chatOpen, setChatOpen, unreadMessagesCount } = useInvestigationStore();
    const { userEmail, fullUser, presenceUsers } = useTopbarPresence(currentCaseId);
    const { isDeleting, handleDeleteCase } = useCaseActions();

    // Background listener for chat unread count
    useChatBackgroundListener(currentCaseId);

    const [profileOpen, setProfileOpen] = useState(false);
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false); // true while a call is live

    return (
        <>
        <header
            className="flex items-center gap-3 px-4 py-3 bg-[#0d1424] border-b border-[#1e3a5f]/50 h-14 relative z-50"
        >
            <TopbarSearch />

            <div className="flex-1 min-w-0" />

            {/* Right side controls */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Voice Comms Button */}
                <div className="relative">
                    <motion.button
                        animate={voiceActive && !voiceOpen ? {
                            borderColor: ["rgba(16, 185, 129, 0.2)", "rgba(16, 185, 129, 0.8)", "rgba(16, 185, 129, 0.2)"],
                            boxShadow: [
                                "0 0 0px rgba(16, 185, 129, 0)",
                                "0 0 15px rgba(16, 185, 129, 0.4)",
                                "0 0 0px rgba(16, 185, 129, 0)"
                            ]
                        } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        onClick={() => setVoiceOpen(!voiceOpen)}
                        className={cn(
                            "p-2 rounded-lg border transition-all flex items-center gap-2 group relative shrink-0",
                            voiceOpen
                                ? "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                : voiceActive
                                ? "bg-emerald-600/20 text-emerald-400"
                                : "bg-[#1e293b] border-[#1e3a5f]/60 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
                        )}
                        title="Voice Comms"
                    >
                        <motion.div
                            animate={voiceActive ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1.8 }}
                        >
                            <Radio size={14} className={voiceOpen || voiceActive ? "text-emerald-300" : ""} />
                        </motion.div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Voice</span>
                        {voiceActive && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                            </span>
                        )}
                    </motion.button>
                </div>

                {/* Team Chat Button */}
                <button 
                    onClick={() => {
                        setChatOpen(!chatOpen);
                    }}
                    className={cn(
                        "p-2 rounded-lg border transition-all flex items-center gap-2 group relative shrink-0",
                        chatOpen 
                            ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]" 
                            : "bg-[#1e293b] border-[#1e3a5f]/60 text-slate-400 hover:border-blue-500/50 hover:text-white"
                    )}
                    title="Team Chat"
                >
                    <div className="relative">
                        <MessageSquare size={14} className={cn(chatOpen ? "animate-pulse" : "group-hover:rotate-12 transition-transform")} />
                        {unreadMessagesCount > 0 && !chatOpen && (
                            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-[#0d1424] animate-bounce">
                                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Chat</span>
                    {chatOpen && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                        </span>
                    )}
                </button>

                <PresenceIndicator presenceUsers={presenceUsers} />
            </div>

            <CollaboratorInvite />

            {/* Delete Case Button */}
            {currentCaseId && (
                <button
                    onClick={() => handleDeleteCase(fullUser)}
                    disabled={isDeleting}
                    className="p-2 rounded-lg border bg-red-950/30 border-red-500/30 text-red-300 hover:bg-red-950/50 hover:border-red-500/50 disabled:opacity-50 transition-all flex items-center gap-2 group shrink-0"
                    title="Delete this case"
                >
                    <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">{isDeleting ? "Deleting..." : "Delete"}</span>
                </button>
            )}

            <UserNav userEmail={userEmail} onClick={() => setProfileOpen(!profileOpen)} />

        </header>

        <VoiceCommsOverlay
            fullUser={fullUser}
            currentCaseId={currentCaseId}
            voiceOpen={voiceOpen}
            setVoiceActive={setVoiceActive}
        />

        {fullUser && (
            <ProfilePanel 
                isOpen={profileOpen} 
                onClose={() => setProfileOpen(false)} 
                user={fullUser} 
            />
        )}

        <AnimatePresence>
            {chatOpen && (
                <ChatSidePanel 
                    setIsOpen={setChatOpen} 
                    currentCaseId={currentCaseId} 
                    fullUser={fullUser} 
                />
            )}
        </AnimatePresence>
        </>
    );
}
