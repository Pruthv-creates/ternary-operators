import { useRef } from "react";
import { Loader2, FileText, Flag } from "lucide-react";

interface TimelineActionsProps {
    onUploadClick: () => void;
    onAddHypothesis: () => void;
    uploading: boolean;
}

export function TimelineActions({ onUploadClick, onAddHypothesis, uploading }: TimelineActionsProps) {
    return (
        <div className="flex justify-center gap-3 py-2 pointer-events-auto">
            <button 
                onClick={onUploadClick}
                disabled={uploading}
                className="group flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0d1424] border border-slate-700 hover:border-blue-500/50 hover:bg-[#1e293b] transition-all disabled:opacity-50 shadow-lg shadow-black/20"
            >
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20">
                    {uploading ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <FileText size={12} strokeWidth={3} />
                    )}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-200">
                    {uploading ? "Ingesting..." : "Add Evidence"}
                </span>
            </button>
            <button 
                onClick={onAddHypothesis}
                className="group flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-amber-950 font-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-900/20"
            >
                <Flag size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Add Hypothesis</span>
            </button>
        </div>
    );
}
