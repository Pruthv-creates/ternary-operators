import { Terminal, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    newMessage: string;
    setNewMessage: (val: string) => void;
    sendMessage: (e?: React.FormEvent) => void;
    loading: boolean;
    currentUserId: string;
}

export function ChatInput({
    newMessage,
    setNewMessage,
    sendMessage,
    loading,
    currentUserId
}: ChatInputProps) {
    return (
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
                    <span className="text-[8px] font-black text-slate-600 uppercase tabular-nums">ID: {currentUserId.substring(0,8)}</span>
                </div>
            </div>
        </footer>
    );
}
