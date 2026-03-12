import { MoreHorizontal, ChevronRight, X } from "lucide-react";

interface HeaderProps {
    isPanel?: boolean;
    onClose?: () => void;
}

export function AIAssistantHeader({ isPanel, onClose }: HeaderProps) {
    return (
        <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-[#1e3a5f]/30">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-xs font-black text-white italic">AI</span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[13px] font-bold text-white truncate">Intellect AI</span>
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 transition-colors">
                    <MoreHorizontal size={14} />
                </button>
                {isPanel ? (
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                        <ChevronRight size={16} />
                    </button>
                ) : (
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
