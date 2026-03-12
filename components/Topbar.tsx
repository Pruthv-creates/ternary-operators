"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, MessageSquare, X, Trash2, Mic, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProfilePanel from "./ProfilePanel";
import CollaboratorInvite from "./CollaboratorInvite";
import TeamChat from "./TeamChat";
import VoiceComms from "./VoiceComms";
import ChatSidePanel from "./topbar/ChatSidePanel";
import VoiceCommsOverlay from "./topbar/VoiceCommsOverlay";
import { useInvestigationStore } from "@/store/investigationStore";
import { getCaseInvestigators, deleteCase } from "@/app/actions/case";
import { useRouter } from "next/navigation";

export default function Topbar() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string>("Agent");
    const [fullUser, setFullUser] = useState<any>(null);
    const [presenceUsers, setPresenceUsers] = useState<any[]>([]);
    const [profileOpen, setProfileOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false); // true while a call is live
    const [validInvestigators, setValidInvestigators] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const { currentCaseId } = useInvestigationStore();
    
    const handleDeleteCase = async () => {
        if (!currentCaseId || !fullUser) return;
        
        if (!window.confirm("Are you sure you want to delete this case? This action cannot be undone.")) {
            return;
        }
        
        setIsDeleting(true);
        try {
            const result = await deleteCase(currentCaseId, fullUser.id);
            if (result.success) {
                // Clear store state so stale case ID is not re-loaded
                useInvestigationStore.setState({ 
                    currentCaseId: null, 
                    nodes: [], 
                    edges: [],
                    selectedEntity: null
                });
                localStorage.removeItem("astraeus_last_case_id");
                router.push("/cases");
            } else {
                alert("Failed to delete case: " + result.error);
            }
        } catch (error) {
            alert("Error deleting case: " + String(error));
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (!currentCaseId) {
            setValidInvestigators([]);
            return;
        }
        getCaseInvestigators(currentCaseId).then(setValidInvestigators);
    }, [currentCaseId]);

    useEffect(() => {
        // 1. Get current user
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Agent";
                setUserEmail(name);
                setFullUser({
                    id: data.user.id,
                    name,
                    email: data.user.email,
                    avatar: data.user.user_metadata?.avatar_url
                });
            }
        });

        // 2. Setup Presence
        const channel = supabase.channel("collaboration", {
            config: {
                presence: {
                    key: "investigators",
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const allOnline = Object.values(state).flat().map((p: any) => ({
                    id: p.user_id,
                    initials: (p.name || "A").substring(0, 2).toUpperCase(),
                    name: p.name || "Agent",
                    color: p.color || "bg-blue-500",
                }));

                // Filter by investigators on this case
                if (currentCaseId && validInvestigators.length > 0) {
                    setPresenceUsers(allOnline.filter(u => validInvestigators.includes(u.id)));
                } else {
                    setPresenceUsers(allOnline);
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
                        const randomColor = colors[Math.floor(Math.random() * colors.length)];
                        
                        await channel.track({
                            user_id: user.id,
                            name: user.user_metadata?.full_name || user.email?.split("@")[0],
                            color: randomColor,
                        });
                    }
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentCaseId, validInvestigators]);

    return (
        <>
        <header
            className="flex items-center gap-3 px-4 py-3 bg-[#0d1424] border-b border-[#1e3a5f]/50 h-14 relative z-50"
        >
            {/* Search */}
            <div className="relative w-56 shrink-0">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#1e293b] border border-[#1e3a5f]/60 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#263144] transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-mono">⌘K</div>
            </div>

            <div className="flex-1 min-w-0" />

            {/* Right side controls */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Voice Comms Button — stays green while call is live, even when panel is closed */}
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
                        {/* Live call indicator — visible even when panel is closed */}
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
                    <MessageSquare size={14} className={cn(chatOpen ? "animate-pulse" : "group-hover:rotate-12 transition-transform")} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Chat</span>
                    {chatOpen && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                        </span>
                    )}
                </button>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] border border-[#1e3a5f]/60 rounded-lg shrink-0">
                    <div className="relative flex -space-x-1.5">
                        {presenceUsers.length > 0 ? (
                            presenceUsers.map((u, i) => (
                                <div
                                    key={`${u.initials}-${i}`}
                                    title={u.name}
                                    className={`w-5 h-5 rounded-full ${u.color} flex items-center justify-center text-[8px] font-bold text-white border border-[#0d1424]`}
                                >
                                    {u.initials}
                                </div>
                            ))
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white border border-[#0d1424]">
                                ?
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {presenceUsers.length > 1 ? `${presenceUsers.length} Investigators` : "Active"}
                    </span>
                </div>
            </div>

            <CollaboratorInvite />

            {/* Delete Case Button */}
            {currentCaseId && (
                <button
                    onClick={handleDeleteCase}
                    disabled={isDeleting}
                    className="p-2 rounded-lg border bg-red-950/30 border-red-500/30 text-red-300 hover:bg-red-950/50 hover:border-red-500/50 disabled:opacity-50 transition-all flex items-center gap-2 group shrink-0"
                    title="Delete this case"
                >
                    <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">{isDeleting ? "Deleting..." : "Delete"}</span>
                </button>
            )}

            {/* User profile */}
            <div
                className="flex items-center gap-2.5 pl-3 border-l border-[#1e3a5f]/50 cursor-pointer group shrink-0"
                onClick={() => setProfileOpen(!profileOpen)}
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase group-hover:ring-2 ring-blue-500/50 transition-all shrink-0">
                    {userEmail[0]}
                </div>
                <div className="hidden sm:flex flex-col leading-none gap-0.5">
                    <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide max-w-[96px] truncate">{userEmail}</span>
                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Profile</span>
                </div>
            </div>

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

        {/* Chat Side Panel */}
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

