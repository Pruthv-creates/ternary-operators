"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, RefreshCw, User, Camera } from "lucide-react";
import { updateUserProfile } from "@/app/actions/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileEditorProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
}

const AVATAR_STYLES = [
    "avataaars",
    "bottts",
    "pixel-art",
    "identicon",
    "micah",
];

export default function ProfileEditor({ isOpen, onClose, user }: ProfileEditorProps) {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar || "");
    const [isSaving, setIsSaving] = useState(false);
    const [activeStyle, setActiveStyle] = useState(AVATAR_STYLES[1]); // bottts

    const generateNewAvatar = () => {
        const seed = Math.random().toString(36).substring(7);
        setAvatar(`https://api.dicebear.com/7.x/${activeStyle}/svg?seed=${seed}`);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Update Supabase Auth metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { 
                    full_name: name,
                    avatar_url: avatar
                }
            });

            if (authError) throw authError;

            // 2. Update Prisma DB
            const result = await updateUserProfile(user.id, { name, avatar });
            
            if (result.success) {
                toast.success("Profile updated successfully");
                onClose();
                // We might need to refresh the page or update global state
                window.location.reload(); 
            } else {
                toast.error("Failed to update database: " + result.error);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Error updating profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-[#0d1424] border border-[#1e3a5f]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#1e3a5f]/30 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">Edit Profile</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Update your agent identity</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Avatar Preview */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl ring-4 ring-blue-500/20 overflow-hidden">
                                {avatar ? (
                                    <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    name[0]?.toUpperCase() || "?"
                                )}
                            </div>
                            <button 
                                onClick={generateNewAvatar}
                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-90"
                                title="Generate New Identity"
                            >
                                <RefreshCw size={18} className={cn(isSaving && "animate-spin")} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                            {AVATAR_STYLES.map((style) => (
                                <button
                                    key={style}
                                    onClick={() => {
                                        setActiveStyle(style);
                                        setAvatar(`https://api.dicebear.com/7.x/${style}/svg?seed=${name || 'agent'}`);
                                    }}
                                    className={cn(
                                        "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all",
                                        activeStyle === style 
                                            ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                                            : "bg-[#161f33] border-[#1e3a5f]/40 text-slate-500 hover:border-slate-400"
                                    )}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Agent Handle</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter agent name..."
                                    className="w-full bg-[#161f33] border border-[#1e3a5f]/60 rounded-2xl py-4 pl-11 pr-4 text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avatar Identity Token (URL)</label>
                            <div className="relative">
                                <Camera size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text"
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                    placeholder="External URL or identity token..."
                                    className="w-full bg-[#161f33] border border-[#1e3a5f]/60 rounded-2xl py-4 pl-11 pr-4 text-[11px] font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-black/20 border-t border-[#1e3a5f]/20 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-2xl border border-[#1e3a5f]/40 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="flex-3 px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                        Sync Identity
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function Settings({ size, className }: { size: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );
}
