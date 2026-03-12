"use client";

import { motion } from "framer-motion";
import { X, MessageSquare } from "lucide-react";
import TeamChat from "@/components/chat/TeamChat";

interface ChatSidePanelProps {
    setIsOpen: (val: boolean) => void;
    currentCaseId: string | null;
    fullUser: any;
}

export default function ChatSidePanel({
    setIsOpen,
    currentCaseId,
    fullUser
}: ChatSidePanelProps) {
    if (!fullUser) return null;

    return (
        <>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
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
                        onClick={() => setIsOpen(false)}
                        className="absolute -left-12 top-4 w-10 h-10 rounded-xl bg-[#0d1424] border border-[#1e3a5f]/50 hidden sm:flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-2xl z-20"
                    >
                        <X size={20} />
                    </button>
                    
                    {/* Mobile Close Button */}
                    <button 
                        onClick={() => setIsOpen(false)}
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
                            onClose={() => setIsOpen(false)}
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
    );
}
