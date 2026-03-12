"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamChat } from "@/hooks/useTeamChat";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatInput } from "./chat/ChatInput";

interface TeamChatProps {
  caseId: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function TeamChat({ caseId, currentUser }: TeamChatProps) {
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
        <div className="flex flex-col h-full bg-[#070b14]/95 sm:border border-[#1e3a5f]/20 sm:rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] relative ring-1 ring-white/5">
            
            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
            </div>

            <ChatHeader />

            {/* Messages - Atmospheric Intel Log */}
            <main 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar scroll-smooth min-h-0 relative z-10"
            >
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-4 mb-6 backdrop-blur-md"
                    >
                        <div className="mt-0.5">
                            <AlertCircle size={16} className="text-red-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-red-400">Security Alert</h4>
                            <p className="text-[10px] text-red-300 font-medium leading-relaxed opacity-80">{error}</p>
                        </div>
                    </motion.div>
                )}

                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[40px] rounded-full" />
                            <div className="w-24 h-24 rounded-[3rem] bg-[#0d152a] border border-blue-500/20 flex items-center justify-center relative ring-1 ring-white/5">
                                <Sparkles size={48} className="text-blue-500/30" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Channel Idle</p>
                            <p className="text-[10px] text-slate-500 font-bold max-w-[200px] leading-relaxed">
                                Awaiting encrypted transmissions from investigators in this sector.
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => {
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
                    })
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
