"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface CanvasToolbarRightProps {
    isSearching: boolean;
    setIsSearching: (val: boolean) => void;
    searchQuery: string;
    handleSearch: (val: string) => void;
    collaborators: Record<string, any>;
}

export default function CanvasToolbarRight({
    isSearching,
    setIsSearching,
    searchQuery,
    handleSearch,
    collaborators,
}: CanvasToolbarRightProps) {
    return (
        <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
            {/* Search */}
            <div className={cn(
                "flex items-center transition-all duration-300 rounded-lg border",
                isSearching
                    ? "w-44 bg-[#0d1424] border-blue-500/50"
                    : "w-9 bg-[#0d1424]/90 border-[#1e3a5f]/50 backdrop-blur-sm"
            )}>
                <button
                    onClick={() => setIsSearching(!isSearching)}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 flex-shrink-0"
                >
                    <Search size={14} strokeWidth={2.5} />
                </button>
                {isSearching && (
                    <input
                        autoFocus
                        placeholder="Find node..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="bg-transparent border-none outline-none text-[11px] text-white w-full pr-2 placeholder:text-slate-600"
                    />
                )}
            </div>

        </div>
    );
}
