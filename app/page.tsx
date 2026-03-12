"use client";

import InvestigationCanvas from "@/components/canvas/InvestigationCanvas";
import Timeline from "@/components/timeline/Timeline";
import ContextPanel from "@/components/sidebar/ContextPanel";
import { timelineEvents } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";

import { useEffect } from "react";

export default function Home() {
    const { selectedEntity, setSelectedEntity } = useInvestigationStore();

    return (
        <div className="flex flex-1 min-h-0 overflow-hidden relative h-full">
            {/* Center: Canvas + Timeline overlay */}
            <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden bg-[#0a0f1c]">
                <InvestigationCanvas />
                <Timeline events={timelineEvents} />
            </div>

            {/* Right Context Panel (Entity Details) */}
            <ContextPanel
                entity={selectedEntity}
                onClose={() => setSelectedEntity(null)}
            />
        </div>
    );
}
