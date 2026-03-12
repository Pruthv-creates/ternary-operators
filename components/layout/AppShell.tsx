"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import AIAssistant from "@/components/ai/AIAssistant";
import { aiActions } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";
import { useAI } from "@/hooks/useAI";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { aiPanelOpen, setAIPanelOpen, currentCaseId } = useInvestigationStore();
    const { askAI } = useAI();

    const handleAskAI = (q: string) => askAI(q, currentCaseId || undefined);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0f1c] font-sans text-slate-300">
            {/* Persistent Sidebar — mounts once, never remounts on navigation */}
            <Sidebar />

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Persistent Topbar */}
                <Topbar />

                {/* Page content + optional AI panel side-by-side */}
                <div className="flex flex-1 min-h-0 overflow-hidden relative">
                    {/* Page content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        {children}
                    </div>

                    {/* Right AI Intellect Panel */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out border-l border-[#1e3a5f]/40 bg-[#0d1424] overflow-hidden flex flex-col h-full",
                        aiPanelOpen ? "w-[350px] min-w-[350px]" : "w-0 border-l-0"
                    )}>
                        <AIAssistant
                            actions={aiActions}
                            askAI={handleAskAI}
                            isPanel={true}
                            onClose={() => setAIPanelOpen(false)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
