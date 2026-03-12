"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hash, Shield, Zap, Sparkles, Terminal, User, Clock, AlertCircle, MoreHorizontal } from "lucide-react";
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
      setError(`Failed to load message history: ${err.message || "Unauthorized Access"}`);
    }
  }, [caseId]);

  useEffect(() => {
    if (!caseId) return;

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
          setMessages((prev) => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

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

      if (sendError) throw sendError;
      setNewMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(`Transmission Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#070b14]/95 sm:border border-[#1e3a5f]/20 sm:rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] relative ring-1 ring-white/5">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header - Advanced Control Hub Styling */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/40 transition-all rounded-full" />
            <div className="w-12 h-12 rounded-2xl bg-[#0d152a] border border-blue-500/30 flex items-center justify-center relative shadow-2xl">
              <Shield size={22} className="text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Intel Feed</h3>
                <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Secure High</span>
                </div>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] flex items-center gap-1.5">
                <Terminal size={10} /> Node: OPS_A_77
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <Zap size={14} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <MoreHorizontal size={14} />
            </button>
        </div>
      </header>



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
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest text-red-400">Security Alert</h4>
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
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col max-w-[90%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start",
                  isConsecutive ? "mt-1" : "mt-8"
                )}
              >
                {/* Meta Header */}
                {!isConsecutive && (
                    <div className={cn(
                        "flex items-center gap-3 mb-3 px-2",
                        isMe ? "flex-row-reverse" : "flex-row"
                    )}>
                        <div className="relative">
                            <div className={cn(
                                "absolute inset-0 blur-md rounded-lg",
                                isMe ? "bg-blue-500/20" : "bg-white/10"
                            )} />
                            {msg.sender_avatar ? (
                                <img src={msg.sender_avatar} className="w-7 h-7 rounded-lg object-cover relative border border-white/10" />
                            ) : (
                                <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black relative border uppercase",
                                    isMe ? "bg-blue-500 text-white border-blue-400/30" : "bg-[#161b2a] text-slate-400 border-white/10"
                                )}>
                                    {msg.sender_name.substring(0, 2)}
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] font-black text-white uppercase tracking-wider">{msg.sender_name}</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tabular-nums">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}

                {/* Bubble - High Tech Stealth Aesthetic */}
                <div className={cn(
                  "px-5 py-3 relative group transition-all duration-300",
                  isMe 
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-none shadow-[0_10px_40px_-10px_rgba(37,99,235,0.4)]" 
                    : "bg-white/5 text-slate-200 border border-white/10 rounded-2xl rounded-tl-none backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20",
                   isConsecutive && (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl")
                )}>
                    <p className="text-[13px] leading-[1.6] font-medium tracking-tight whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Stealth Hover Log */}
                    <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none",
                        isMe ? "right-full mr-4 text-right" : "left-full ml-4"
                    )}>
                         <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest bg-blue-500/5 px-2 py-1 rounded ring-1 ring-blue-500/10">
                                TRANSMITTED
                            </span>
                            <div className="w-[1px] h-4 bg-gradient-to-b from-blue-500/20 to-transparent mt-1" />
                         </div>
                    </div>
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Input Module - Operations Terminal style */}
      <footer className="flex-shrink-0 p-6 sm:p-8 bg-gradient-to-t from-[#0a0f1c] to-transparent border-t border-white/5 backdrop-blur-3xl z-20">
        <form 
          onSubmit={sendMessage}
          className="relative group "
        >
          {/* Neon Border Glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-blue-600/20 rounded-[1.25rem] blur-[2px] group-focus-within:opacity-100 opacity-50 transition-opacity" />
          
          <div className="relative flex items-center bg-[#070b14]/80 rounded-[1.25rem] border border-white/10 group-focus-within:border-blue-500/40 transition-all overflow-hidden p-1.5">
            <div className="pl-4 pr-2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                <Terminal size={16} />
            </div>
            <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                }}
                rows={1}
                placeholder="Enter intelligence update..."
                className="flex-1 bg-transparent border-none py-3 text-[14px] text-white placeholder-slate-700 focus:ring-0 focus:outline-none resize-none max-h-32 custom-scrollbar"
                style={{ height: '42px' }}
                disabled={loading}
            />
            <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                newMessage.trim() 
                    ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 translate-x-0" 
                    : "text-slate-700 bg-white/5 -translate-x-2 opacity-0 pointer-events-none"
                )}
            >
                <Send size={18} />
            </button>
          </div>
        </form>
        
        <div className="mt-5 flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Linked</span>
                </div>
                <div className="h-3 w-[1px] bg-white/5" />
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest">TLS 1.3 Active</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                <User size={10} className="text-slate-600" />
                <span className="text-[8px] font-black text-slate-600 uppercase tabular-nums">ID: {currentUser.id.substring(0,8)}</span>
            </div>
        </div>
      </footer>
    </div>
  );
}
