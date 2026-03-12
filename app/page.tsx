"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import InvestigationCanvas from "@/components/InvestigationCanvas";
import Timeline from "@/components/Timeline";
import ContextPanel from "@/components/ContextPanel";
import AIAssistant from "@/components/AIAssistant";
import { timelineEvents, aiActions } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";

/* AI response type */
type AIResponse = {
  answer: string;
  sources: string[];
};

export default function Home() {
    const { selectedEntity, setSelectedEntity } = useInvestigationStore();

    // AI backend request
    async function askAI(question: string): Promise<AIResponse> {
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question }),
            });

            const data: AIResponse = await res.json();
            return data;
        } catch (error) {
            console.error("AI request failed:", error);

            return {
                answer: "AI backend connection failed.",
                sources: [],
            };
        }
    }

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

                    {/* Right Context Panel */}
                    <ContextPanel
                        entity={selectedEntity}
                        onClose={() => setSelectedEntity(null)}
                    />
                </div>
            </div>

            {/* Floating AI Assistant */}
            {!selectedEntity && (
                <div className="fixed bottom-4 right-4 z-30 pointer-events-none">
                    <div className="pointer-events-auto">
                        <AIAssistant actions={aiActions} askAI={askAI} />
                    </div>
                </div>
            )}
        </div>
    );
}
