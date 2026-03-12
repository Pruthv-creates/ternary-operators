"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hash, User, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
}

interface TeamChatProps {
  caseId: string;
  currentUser: {
    id: string;
    name: string;
  };
}

export default function TeamChat({ caseId, currentUser }: TeamChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages and subscribe to new ones
  useEffect(() => {
    if (!caseId) return;

    const channel = supabase
      .channel(`case-chat:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ChatMessage",
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    fetchMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("ChatMessage")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  }

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !caseId) return;

    setLoading(true);
    const { error } = await supabase.from("ChatMessage").insert([
      {
        content: newMessage.trim(),
        case_id: caseId,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1424]/40 border border-[#1e3a5f]/30 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1e3a5f]/40 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Hash size={16} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Team Comms</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Secure Real-time Channel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center">
                <Hash size={32} className="text-slate-600" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Commence secure transmission.<br/>
              <span className="text-[10px] lowercase font-normal italic">No logs found in project history.</span>
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border uppercase shadow-inner shrink-0",
                  isMe ? "bg-blue-600 border-blue-400 text-white" : "bg-[#0a0f1c] border-[#1e3a5f]/40 text-slate-400"
                )}>
                  {msg.sender_name.substring(0, 2).toUpperCase()}
                </div>

                <div className={cn(
                  "flex flex-col max-w-[75%]",
                  isMe ? "items-end" : "items-start"
                )}>
                  {/* Sender Info */}
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight">{msg.sender_name}</span>
                      <span className="text-[8px] font-bold text-slate-600 uppercase tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed relative group",
                    isMe 
                      ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20" 
                      : "bg-[#1a2333] text-slate-300 border border-[#1e3a5f]/30 rounded-tl-none shadow-md"
                  )}>
                    {msg.content}
                    
                    {isMe && (
                        <div className="absolute top-0 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-[8px] font-bold text-slate-600 uppercase tabular-nums">
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

      {/* Input */}
      <div className="p-4 bg-white/[0.02] border-t border-[#1e3a5f]/40">
        <form 
          onSubmit={sendMessage}
          className="relative group"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Transmit secure message..."
            className="w-full bg-[#0a0f1c] border border-[#1e3a5f]/60 rounded-2xl pl-5 pr-14 py-3 text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              newMessage.trim() 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95" 
                : "text-slate-600 cursor-not-allowed"
            )}
          >
            <Send size={16} />
          </button>
        </form>
        <div className="mt-3 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 opacity-30">
                <Clock size={10} className="text-slate-400" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">End-to-End Encrypted</span>
            </div>
        </div>
      </div>
    </div>
  );
}
