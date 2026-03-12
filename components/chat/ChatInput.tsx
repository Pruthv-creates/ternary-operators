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
        <footer className="flex-shrink-0 p-4 sm:p-6 bg-[#050810]/80 border-t border-white/5 backdrop-blur-3xl z-20">
            <form 
                onSubmit={sendMessage}
                className="relative group "
            >
                <div className="relative flex items-center bg-[#0d121f] rounded-2xl border border-white/5 group-focus-within:border-blue-500/30 transition-all overflow-hidden p-1">
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
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none py-2.5 px-4 text-[13px] text-white placeholder-slate-600 focus:ring-0 focus:outline-none resize-none max-h-32 custom-scrollbar"
                        style={{ height: '40px' }}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !newMessage.trim()}
                        className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 mr-1",
                        newMessage.trim() 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95" 
                            : "text-slate-600 bg-white/5 pointer-events-none opacity-50"
                        )}
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
            
            <div className="mt-4 flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Enclave Linked</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">
                    <span className="text-[7px] font-black text-slate-600 uppercase tabular-nums tracking-tighter">SIG: {currentUserId.substring(0,8)}</span>
                </div>
            </div>
        </footer>
    );
}
