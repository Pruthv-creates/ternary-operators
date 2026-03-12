"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamChat } from "@/hooks/chat/useTeamChat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";

interface TeamChatProps {
  caseId: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onClose?: () => void;
}

export default function TeamChat({ caseId, currentUser, onClose }: TeamChatProps) {
    const {
        messages,
        newMessage,
        setNewMessage,
        loading,
        error,
        sendMessage
    } = useTeamChat(caseId, currentUser);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-[#050810] border border-[#1e3a5f]/20 rounded-3xl overflow-hidden backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            
            {/* Dynamic Ambient Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[100px] rounded-full" />
            </div>

            <ChatHeader onClose={onClose} />

            {/* Messages Stream */}
            <main 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar scroll-smooth relative z-10"
            >
                {/* Security Status Hint */}
                <div className="flex items-center justify-center py-4">
                    <div className="px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.2em]">End-to-End Encrypted Session</span>
                    </div>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 backdrop-blur-md"
                    >
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                        <span className="text-[10px] text-red-300 font-bold uppercase tracking-wide">{error}</span>
                    </motion.div>
                )}

                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                            <Sparkles size={24} className="text-blue-400" />
                        </div>
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Initialize Transmission</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {messages.map((msg, i) => {
                            const isMe = msg.sender_id === currentUser.id;
                            const prevMsg = messages[i - 1];
                            const isConsecutive = prevMsg && prevMsg.sender_id === msg.sender_id;

                            return (
                                <ChatMessage 
                                    key={msg.id || i}
                                    msg={msg}
                                    isMe={isMe}
                                    isConsecutive={isConsecutive}
                                />
                            );
                        })}
                    </div>
                )}
            </main>

            <ChatInput 
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendMessage={sendMessage}
                loading={loading}
                currentUserId={currentUser.id}
            />
        </div>
    );
}
