"use client";

import { useCallback } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import EntityNode from "./EntityNode";
import EvidenceNode from "./EvidenceNode";
import HypothesisNode from "./HypothesisNode";
import { entities } from "@/lib/data";
import { Entity, EntityType } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";
import { useState } from "react";
import { Brain, Loader2, Plus } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: any = {
    entity: EntityNode,
    evidence: EvidenceNode,
    hypothesis: HypothesisNode,
};

export default function InvestigationCanvas() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setSelectedEntity,
        addStickyNote,
    } = useInvestigationStore();

    const [analyzing, setAnalyzing] = useState(false);
    const [aiMessage, setAiMessage] = useState<string | null>(null);

    const onNodeClick: NodeMouseHandler = useCallback(
        (_event, node) => {
            if (node.type === "entity") {
                const staticEntity = entities.find((e: Entity) => e.id === node.id);
                if (staticEntity) {
                    setSelectedEntity(staticEntity);
                } else {
                    setSelectedEntity({
                        id: node.id,
                        name: node.data.name as string,
                        role: node.data.role as string,
                        type: node.data.type as EntityType,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        avatar: (node.data as any).avatar,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        status: (node.data as any).status,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        credibilityScore: (node.data as any).credibilityScore,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        industry: (node.data as any).industry,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        location: (node.data as any).location,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        riskScore: (node.data as any).riskScore,
                    });
                }
            }
        },
        [setSelectedEntity]
    );

    const runAIAnalysis = async () => {
        setAnalyzing(true);
        setAiMessage(null);
        try {
            const res = await fetch("/api/ai/analyze", { method: "POST" });
            const data = await res.json();
            if (data.nodes || data.edges) {
                const oldNodesCount = nodes.length;
                useInvestigationStore.getState().addAIResult(data);
                const newNodesCount = useInvestigationStore.getState().nodes.length - oldNodesCount;
                setAiMessage(`AI identified ${newNodesCount} new entities and mapped their connections.`);
                setTimeout(() => setAiMessage(null), 5000);
            }
        } catch (error) {
            console.error("AI Analysis failed:", error);
            setAiMessage("Analysis failed. Ensure backend-ai is reachable.");
        } finally {
            setAnalyzing(false);
        }
    };

    const addNewEntity = () => {
        const id = `user-ent-${Date.now()}`;
        useInvestigationStore.getState().addNode({
            id,
            type: "entity",
            position: { x: 500, y: 300 },
            data: { 
                name: "NEW ENTITY", 
                role: "Assign role...", 
                type: "person", 
                status: "Active",
                riskScore: 0,
                credibilityScore: 100,
                industry: "Unknown",
                location: "Unknown"
            }
        });
    };

    const onPaneClick = useCallback(() => {
        setSelectedEntity(null);
    }, [setSelectedEntity]);

    return (
        <div className="relative flex-1 overflow-hidden bg-[#0a0f1c] canvas-grid">
            {/* Canvas header */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                        <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Investigation Canvas</h2>
                    </div>
                    <button
                        onClick={runAIAnalysis}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20"
                    >
                        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">AI Analysis</span>
                    </button>
                    <button
                        onClick={addNewEntity}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all shadow-lg"
                    >
                        <Plus size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Entity</span>
                    </button>
                </div>
                {aiMessage && (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-left-2 transition-all">
                        ✨ {aiMessage}
                    </div>
                )}
            </div>

            {/* Real Search Box and Avatars Top Right like Image 1 */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
                <button
                    onClick={() => addStickyNote({ x: 400, y: 300 })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#fde88a] text-[#422006] hover:bg-[#d6b83f] transition-colors shadow-md"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Add Sticky</span>
                </button>

                <div className="w-8 h-8 rounded bg-[#1e293b] border border-slate-700/50 flex items-center justify-center text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#1e293b]/70 border border-emerald-500/30">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center -ml-1">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Collaborating</span>
                    </div>
                </div>

                <div className="flex -space-x-1">
                    <img className="w-8 h-8 rounded-full border-2 border-[#0a0f1c] object-cover" src="https://i.pravatar.cc/150?u=a1" alt="Avatar" />
                    <img className="w-8 h-8 rounded-full border-2 border-[#0a0f1c] object-cover" src="https://i.pravatar.cc/150?u=a2" alt="Avatar" />
                    <div className="w-8 h-8 rounded-full border-2 border-[#0a0f1c] bg-emerald-900 text-emerald-300 flex items-center justify-center text-[10px] font-bold">3OR</div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1e293b]/50 border border-slate-700/50 cursor-pointer">
                    <span className="text-[11px] text-slate-300 uppercase font-semibold">Sarah</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>

            {/* React Flow Graph */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.1 }}
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                className="[&_.react-flow__edge-path]:transition-all [&_.react-flow__edge-path]:duration-300"
            >
                {/* Horizontal guide lines background */}
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="rgba(255,255,255,0.03)"
                />
            </ReactFlow>
        </div>
    );
}
