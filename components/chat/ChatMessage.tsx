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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex flex-col w-full",
                isMe ? "items-end" : "items-start",
                isConsecutive ? "mt-0.5" : "mt-4"
            )}
        >
            {/* Meta Header - Minimal & Professional */}
            {!isConsecutive && (
                <div className={cn(
                    "flex items-center gap-2 mb-1.5 px-1",
                    isMe ? "flex-row-reverse" : "flex-row"
                )}>
                    <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black border uppercase shrink-0 transition-colors",
                        isMe ? "bg-blue-600 border-blue-400/30 text-white" : "bg-[#111827] border-white/10 text-slate-400"
                    )}>
                        {msg.sender_name.substring(0, 2)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{msg.sender_name}</span>
                    <span className="text-[8px] font-medium text-slate-600 tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )}

            {/* Content Bubble */}
            <div className={cn(
                "max-w-[85%] px-4 py-2.5 relative group transition-all duration-300",
                isMe 
                    ? "bg-[#1e3a8a] text-blue-50 rounded-2xl rounded-tr-sm border border-blue-500/20 shadow-lg shadow-blue-900/10" 
                    : "bg-[#111827]/80 text-slate-200 border border-white/5 rounded-2xl rounded-tl-sm backdrop-blur-xl",
                isConsecutive && (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl")
            )}>
                <p className="text-[12px] leading-relaxed font-medium tracking-normal whitespace-pre-wrap">{msg.content}</p>
                
                {/* Micro-Interaction Indicator */}
                <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none px-2",
                    isMe ? "right-full" : "left-full"
                )}>
                    <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                </div>
            </div>
        </motion.div>
    );
}
