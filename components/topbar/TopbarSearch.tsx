import { Search } from "lucide-react";

export function TopbarSearch() {
    return (
        <div className="relative w-56 shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
                type="text"
                placeholder="Search..."
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#1e293b] border border-[#1e3a5f]/60 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#263144] transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-mono">⌘K</div>
        </div>
    );
}
