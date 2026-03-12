"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProfilePanel from "./ProfilePanel";
import CollaboratorInvite from "./CollaboratorInvite";

export default function Topbar() {
    const [userEmail, setUserEmail] = useState<string>("Agent");
    const [fullUser, setFullUser] = useState<any>(null);
    const [presenceUsers, setPresenceUsers] = useState<any[]>([]);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        // 1. Get current user
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Agent";
                setUserEmail(name);
                setFullUser({
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
                const users = Object.values(state).flat().map((p: any) => ({
                    initials: (p.name || "A").substring(0, 2).toUpperCase(),
                    name: p.name || "Agent",
                    color: p.color || "bg-blue-500",
                }));
                setPresenceUsers(users);
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
    }, []);

    return (
        <>
        <motion.header
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
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

            {/* Collaboration indicator */}
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
                <span className="text-[10px] text-slate-400 font-medium">
                    {presenceUsers.length > 1 ? `${presenceUsers.length} Investigators` : "Active"}
                </span>
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

        </motion.header>

        {fullUser && (
            <ProfilePanel 
                isOpen={profileOpen} 
                onClose={() => setProfileOpen(false)} 
                user={fullUser} 
            />
        )}
        </>
    );
}

