import { Search, Loader2 } from "lucide-react";

interface AgentSearchProps {
    query: string;
    onQueryChange: (q: string) => void;
    searching: boolean;
}

export function AgentSearch({ query, onQueryChange, searching }: AgentSearchProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">Search Agent by Name</label>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Type agent name or email..."
                    className="w-full pl-9 pr-4 py-3 bg-[#1e293b] border border-[#1e3a5f]/60 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
                />
                {searching && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
                )}
            </div>
        </div>
    );
}
