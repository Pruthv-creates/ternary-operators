"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import InvestigationCanvas from "@/components/InvestigationCanvas";
import Timeline from "@/components/Timeline";
import ContextPanel from "@/components/ContextPanel";
import AIAssistant from "@/components/AIAssistant";
import { timelineEvents, aiActions } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";
import { useAI } from "@/hooks/useAI";
import { cn } from "@/lib/utils";

/* AI response type */
type AIResponse = {
  answer: string;
  sources: string[];
};

import { useEffect } from "react";

export default function Home() {
    const { selectedEntity, setSelectedEntity, aiPanelOpen, setAIPanelOpen } = useInvestigationStore();
    const { askAI } = useAI();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0f1c] font-sans text-slate-300">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Top Bar */}
                <Topbar />

                {/* Content Area */}
                <div className="flex flex-1 min-h-0 overflow-hidden relative">
                    {/* Center: Canvas + Timeline overlay */}
                    <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden bg-[#0a0f1c]">
                        {/* Investigation Canvas */}
                        <InvestigationCanvas />

                        {/* Bottom Timeline */}
                        <Timeline events={timelineEvents} />
                    </div>

                    {/* Right Context Panel (Entity Details) */}
                    <ContextPanel
                        entity={selectedEntity}
                        onClose={() => setSelectedEntity(null)}
                    />

                    {/* Right AI Intellect Panel */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out border-l border-[#1e3a5f]/40 bg-[#0d1424] overflow-hidden flex flex-col h-full",
                        aiPanelOpen ? "w-[350px] min-w-[350px]" : "w-0 border-l-0"
                    )}>
                        <AIAssistant 
                            actions={aiActions} 
                            askAI={askAI} 
                            isPanel={true} 
                            onClose={() => setAIPanelOpen(false)} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
