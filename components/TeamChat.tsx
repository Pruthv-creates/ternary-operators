"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hash, User, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  created_at: string;
}

interface TeamChatProps {
  caseId: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function TeamChat({ caseId, currentUser }: TeamChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError);
        throw fetchError;
      }
      setMessages(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError(`Failed to load message history: ${err.message || "Check RLS/Permissions"}`);
    }
  }, [caseId]);

  // Fetch initial messages and subscribe to new ones
  useEffect(() => {
    if (!caseId) return;

    // Real-time listener
    const channel = supabase
      .channel(`case-chat:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          console.log("New message received via realtime:", payload.new);
          setMessages((prev) => {
            // Check if message already exists (to prevent duplicates from optimistic UI if implemented)
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe((status) => {
        console.log("Supabase Realtime Status:", status);
      });

    fetchMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !caseId) return;

    setLoading(true);
    setError(null);
    
    try {
      const { error: sendError } = await supabase.from("chat_messages").insert([
        {
          id: crypto.randomUUID(),
          content: newMessage.trim(),
          case_id: caseId,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          sender_avatar: currentUser.avatar || null,
        },
      ]);

      if (sendError) {
        console.error("Supabase insert error:", sendError);
        throw sendError;
      }
      setNewMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(`Failed to transmit message: ${err.message || "Check RLS/Permissions"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1424]/80 border border-[#1e3a5f]/40 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#1e3a5f]/40 bg-white/[0.04] flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-500/5">
            <Hash size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-[13px] font-black text-white uppercase tracking-[0.15em]">Team Workspace</h3>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Encrypted Intel Channel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth"
      >
        {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 mb-4">
                <AlertCircle size={14} className="text-red-400" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</span>
            </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-800/30 border border-slate-700/50 flex items-center justify-center">
                <Hash size={40} className="text-slate-600" />
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Initialized</p>
                <p className="text-[10px] text-slate-600 font-medium">No intelligence reports found in this node.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser.id;
            const prevMsg = messages[i - 1];
            const isConsecutive = prevMsg && prevMsg.sender_id === msg.sender_id;

            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-4 group",
                  isMe ? "flex-row-reverse" : "flex-row",
                  isConsecutive ? "mt-[-1.5rem]" : "mt-0"
                )}
              >
                {/* Avatar / Identity */}
                {!isConsecutive ? (
                    <div className="relative shrink-0">
                        {msg.sender_avatar ? (
                            <img 
                                src={msg.sender_avatar} 
                                alt={msg.sender_name} 
                                className={cn(
                                    "w-9 h-9 rounded-2xl object-cover border-2 shadow-xl ring-4 ring-black/10",
                                    isMe ? "border-blue-500" : "border-[#1e3a5f]/40"
                                )}
                            />
                        ) : (
                            <div className={cn(
                                "w-9 h-9 rounded-2xl flex items-center justify-center text-[10px] font-black border shadow-xl ring-4 ring-black/10 uppercase",
                                isMe ? "bg-blue-600 border-blue-400 text-white" : "bg-[#0a0f1c] border-[#1e3a5f]/40 text-slate-400"
                            )}>
                                {msg.sender_name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div className={cn(
                            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0d1424]",
                            isMe ? "bg-blue-400" : "bg-slate-600"
                        )} />
                    </div>
                ) : (
                    <div className="w-9 shrink-0" />
                )}

                <div className={cn(
                  "flex flex-col max-w-[80%]",
                  isMe ? "items-end" : "items-start"
                )}>
                  {/* Sender Name & Details */}
                  {!isConsecutive && (
                    <div className={cn(
                        "flex items-center gap-2 mb-2 px-1",
                        isMe ? "flex-row-reverse" : "flex-row"
                    )}>
                      <span className="text-[11px] font-black text-white uppercase tracking-tight">{msg.sender_name}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn(
                    "px-5 py-3 rounded-[1.25rem] text-[13px] leading-relaxed relative group/bubble transition-all duration-200",
                    isMe 
                      ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10 hover:bg-blue-500" 
                      : "bg-[#1a2333]/90 text-slate-200 border border-white/5 rounded-tl-none shadow-xl backdrop-blur-sm group-hover:border-blue-500/30"
                  )}>
                    {msg.content}
                    
                    {/* Timestamp on hover for consecutive messages */}
                    {isConsecutive && (
                        <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity whitespace-nowrap",
                            isMe ? "right-full mr-3 text-right" : "left-full ml-3"
                        )}>
                             <span className="text-[8px] font-black text-slate-600 uppercase tabular-nums tracking-widest">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Module */}
      <div className="p-6 bg-white/[0.04] border-t border-[#1e3a5f]/40 backdrop-blur-md z-10">
        <form 
          onSubmit={sendMessage}
          className="relative group"
        >
          <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl group-focus-within:bg-blue-500/10 transition-all opacity-0 group-focus-within:opacity-100" />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Transmit secure intel reporting..."
            className="w-full bg-[#0a0f1c]/90 border border-[#1e3a5f]/60 rounded-2xl pl-6 pr-16 py-4 text-[14px] text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/5 transition-all relative z-10 shadow-inner"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className={cn(
              "absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center transition-all z-20",
              newMessage.trim() 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:scale-110 active:scale-90" 
                : "text-slate-700 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Quantum Grade Encryption</span>
            </div>
            <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">v4.2.0-COMM</span>
        </div>
      </div>
    </div>
  );
}
