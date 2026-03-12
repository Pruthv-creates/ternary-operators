"use client";

import { motion } from "framer-motion";
import { Search, Bell, Settings, Wifi } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const avatars = [
    { initials: "MK", color: "bg-blue-500" },
    { initials: "SR", color: "bg-purple-500" },
    { initials: "JD", color: "bg-emerald-500" },
];

export default function Topbar() {
    // User profile
    const [userEmail, setUserEmail] = useState<string>("Agent");

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) {
                setUserEmail(data.user.email.split("@")[0]);
            }
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <motion.header
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-4 px-6 py-3 bg-[#0d1424]/80 backdrop-blur-sm border-b border-[#1e3a5f]/50 h-14"
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
                    {avatars.map((a) => (
                        <div
                            key={a.initials}
                            className={`w-5 h-5 rounded-full ${a.color} flex items-center justify-center text-[8px] font-bold text-white border border-[#0d1424]`}
                        >
                            {a.initials}
                        </div>
                    ))}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Collaborating</span>
                <Wifi size={10} className="text-green-400" />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200">
                <Bell size={16} />
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200">
                <Settings size={16} />
            </button>

            {/* User profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#1e3a5f]/50 cursor-pointer" onClick={handleLogout}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {userEmail[0]}
                </div>
                <div className="hidden sm:block">
                    <div className="text-[11px] font-semibold text-slate-200 uppercase">{userEmail}</div>
                    <div className="text-[9px] text-red-500 hover:text-red-400 font-bold transition-colors">LOG OUT</div>
                </div>
            </div>
        </motion.header>
    );
}

