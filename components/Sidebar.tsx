"use client";

import { useSidebarCases } from "@/hooks/useSidebarCases";
import { SidebarCases } from "./sidebar/SidebarCases";
import { SidebarNav } from "./sidebar/SidebarNav";

export default function Sidebar() {
    const {
        userCases,
        loading,
        creating,
        currentCaseId,
        handleSelectCase,
        handleCreateCase
    } = useSidebarCases();

    return (
        <aside
            className="flex flex-col w-64 min-w-[256px] h-full bg-[#0d1424] border-r border-[#1e3a5f]/40 z-10"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e3a5f]/50">
                <img 
                    src="/logo.png" 
                    alt="Astraeus Logo" 
                    className="h-10 w-auto object-contain brightness-0 invert"
                />
            </div>

            <SidebarCases 
                userCases={userCases}
                loading={loading}
                creating={creating}
                currentCaseId={currentCaseId}
                handleSelectCase={handleSelectCase}
                handleCreateCase={handleCreateCase}
            />

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1e3a5f]/60 to-transparent mx-4 my-2" />

            <SidebarNav />

            {/* Bottom status */}
            <div className="px-4 py-4 border-t border-[#1e3a5f]/50">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span>System Operational</span>
                </div>
            </div>
        </aside>
    );
}
