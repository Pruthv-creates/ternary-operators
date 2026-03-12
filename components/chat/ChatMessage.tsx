import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Message } from "@/hooks/chat/useTeamChat";

interface ChatMessageProps {
    msg: Message;
    isMe: boolean;
    isConsecutive: boolean;
}

export function ChatMessage({ msg, isMe, isConsecutive }: ChatMessageProps) {
    return (
        <motion.div
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
                            <img src={msg.sender_avatar} className="w-7 h-7 rounded-lg object-cover relative border border-white/10" alt={msg.sender_name} />
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
}
