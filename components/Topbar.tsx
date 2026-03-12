"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, MessageSquare, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProfilePanel from "./ProfilePanel";
import CollaboratorInvite from "./CollaboratorInvite";
import TeamChat from "./TeamChat";
import { useInvestigationStore } from "@/store/investigationStore";
import { getCaseInvestigators } from "@/app/actions/case";

export default function Topbar() {
    const [userEmail, setUserEmail] = useState<string>("Agent");
    const [fullUser, setFullUser] = useState<any>(null);
    const [presenceUsers, setPresenceUsers] = useState<any[]>([]);
    const [profileOpen, setProfileOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [validInvestigators, setValidInvestigators] = useState<string[]>([]);
    const { currentCaseId } = useInvestigationStore();

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
            className="flex items-center gap-4 px-6 py-3 bg-[#0d1424]/80 backdrop-blur-sm border-b border-[#1e3a5f]/50 h-14 relative z-50"
        >
            {/* Search */}
            <div className="flex-1 relative max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search cases, entities, evidence..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-[#1e293b] border border-[#1e3a5f]/60 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#263144] transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-mono">⌘K</div>
            </div>

            <div className="flex-1" />

            {/* Team Chat Trigger & Collaboration indicator */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => {
                        console.log("Chat toggle clicked. Current state:", !chatOpen, "CaseId:", currentCaseId, "User:", fullUser?.id);
                        setChatOpen(!chatOpen);
                    }}
                    className={cn(
                        "p-2 rounded-lg border transition-all flex items-center gap-2 group relative",
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
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                    )}
                </button>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] border border-[#1e3a5f]/60 rounded-lg">
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



            {/* User profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#1e3a5f]/50 cursor-pointer group" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase group-hover:ring-2 ring-blue-500/50 transition-all">
                    {userEmail[0]}
                </div>
                <div className="hidden sm:block">
                    <div className="text-[11px] font-semibold text-slate-200 uppercase truncate max-w-[80px]">{userEmail}</div>
                    <div className="text-[9px] text-blue-500 hover:text-blue-400 font-bold transition-colors uppercase tracking-widest">Profile</div>
                </div>
            </div>

        </header>

        {fullUser && (
            <ProfilePanel 
                isOpen={profileOpen} 
                onClose={() => setProfileOpen(false)} 
                user={fullUser} 
            />
        )}

        {/* Chat Side Panel */}
        <AnimatePresence>
            {chatOpen && fullUser && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setChatOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div 
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-[70] sm:p-4 flex flex-col"
                    >
                        <div className="flex-1 relative flex flex-col h-full overflow-hidden">
                            <button 
                                onClick={() => setChatOpen(false)}
                                className="absolute -left-12 top-4 w-10 h-10 rounded-xl bg-[#0d1424] border border-[#1e3a5f]/50 hidden sm:flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-2xl z-20"
                            >
                                <X size={20} />
                            </button>
                            
                            {/* Mobile Close Button */}
                            <button 
                                onClick={() => setChatOpen(false)}
                                className="sm:hidden absolute right-4 top-4 w-8 h-8 rounded-lg bg-black/20 backdrop-blur-md flex items-center justify-center text-white z-30"
                            >
                                <X size={18} />
                            </button>
                            
                            {currentCaseId ? (
                                <TeamChat 
                                    caseId={currentCaseId} 
                                    currentUser={{ 
                                        id: fullUser.id, 
                                        name: fullUser.name,
                                        avatar: fullUser.avatar 
                                    }} 
                                />
                            ) : (
                                <div className="flex flex-col h-full bg-[#0d1424]/90 border border-[#1e3a5f]/30 rounded-3xl items-center justify-center p-8 text-center backdrop-blur-md">
                                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
                                        <MessageSquare size={32} className="text-amber-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">No Case Active</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                        Select a Unified Case from the dashboard or sidebar to initiate team communications.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        </>
    );
}

