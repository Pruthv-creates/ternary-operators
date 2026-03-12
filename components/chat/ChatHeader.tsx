import { X } from "lucide-react";

// Header component for team chat

interface ChatHeaderProps {
    onClose?: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
    return (
        <header className="flex-shrink-0 px-6 py-5 border-b border-white/5 bg-[#080d1a]/50 flex items-center justify-between z-20 backdrop-blur-md">
            <div>
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Team Messages</h3>
            </div>
            {onClose && (
                <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    title="Close messages"
                >
                    <X size={16} />
                </button>
            )}
        </header>
    );
}
