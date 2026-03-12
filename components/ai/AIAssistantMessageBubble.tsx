import { cn } from "@/lib/utils";
import { Sparkles, FileText } from "lucide-react";
import { Message } from "./types";
import { formatBytes } from "./utils";

interface AIAssistantMessageBubbleProps {
    message: Message;
    userInitial: string;
}

export function AIAssistantMessageBubble({ message, userInitial }: AIAssistantMessageBubbleProps) {
    const isAssistant = message.role === "assistant";
    
    return (
        <div className={cn(
            "flex gap-3",
            message.role === "user" ? "flex-row-reverse" : "flex-row"
        )}>
            {/* Avatar */}
            <div className={cn(
                "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white",
                isAssistant
                    ? "bg-indigo-600 shadow-md shadow-indigo-900/40"
                    : "bg-gradient-to-br from-purple-500 to-blue-500"
            )}>
                {isAssistant
                    ? <Sparkles size={14} />
                    : <div className="text-[10px] font-bold uppercase">{userInitial}</div>
                }
            </div>

            <div className="flex flex-col gap-1.5 max-w-[85%]">
                {/* Bubble */}
                <div className={cn(
                    "px-4 py-3 rounded-2xl text-[12px] leading-relaxed shadow-sm",
                    isAssistant
                        ? "bg-[#1e293b]/80 text-slate-200 border border-slate-800/50"
                        : "bg-indigo-600 text-white font-medium"
                )}>
                    {message.content}
                </div>

                {/* Attached file chips */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {message.attachments.map((f, fi) => (
                            <div key={fi} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
                                <FileText size={10} className="text-indigo-400 shrink-0" />
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{f.name}</span>
                                <span className="text-[9px] text-slate-600">{formatBytes(f.size)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
