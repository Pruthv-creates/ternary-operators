"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    NodeMouseHandler,
    ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import EntityNode from "./EntityNode";
import EvidenceNode from "./EvidenceNode";
import HypothesisNode from "./HypothesisNode";
import RelationEdge from "./RelationEdge";
import { entities } from "@/lib/data";
import { Entity, EntityType } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";
import CanvasToolbarLeft from "./canvas/CanvasToolbarLeft";
import CanvasToolbarRight from "./canvas/CanvasToolbarRight";
import GhostCursors from "./canvas/GhostCursors";
import { useCanvasCollaborators } from "@/hooks/useCanvasCollaborators";
import { useCanvasAI } from "@/hooks/useCanvasAI";
import { useCanvasSearch } from "@/hooks/useCanvasSearch";

const nodeTypes: any = {
    entity: EntityNode,
    evidence: EvidenceNode,
    hypothesis: HypothesisNode,
};

const edgeTypes = {
    relation: RelationEdge,
};

function CanvasInner() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setSelectedEntity,
    } = useInvestigationStore();

    const canvasRef = useRef<HTMLDivElement>(null);
    const { handleMouseMove, collaborators, CURSOR_THROTTLE_MS } = useCanvasCollaborators(canvasRef);
    const { analyzing, aiMessage, runAIAnalysis } = useCanvasAI();
    const { searchQuery, isSearching, setIsSearching, handleSearch } = useCanvasSearch();

    const [activeFilter, setActiveFilter] = useState("all");
    const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

    // Handle edge edit event
    useEffect(() => {
        const handleEdgeEdit = (event: Event) => {
            const customEvent = event as CustomEvent;
            setEditingEdgeId(customEvent.detail.edgeId);
        };

        window.addEventListener("edge-edit", handleEdgeEdit);
        return () => window.removeEventListener("edge-edit", handleEdgeEdit);
    }, []);

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
                        avatar: (node.data as any).avatar,
                        status: (node.data as any).status,
                        credibilityScore: (node.data as any).credibilityScore,
                        industry: (node.data as any).industry,
                        location: (node.data as any).location,
                        riskScore: (node.data as any).riskScore,
                    });
                }
            }
        },
        [setSelectedEntity]
    );

    const addNewEntity = () => {
        const id = `user-ent-${Date.now()}`;
        useInvestigationStore.getState().addNode({
            id,
            type: "entity",
            position: { x: 500, y: 300 },
            data: { 
                name: "NEW SUSPECT", 
                role: "Analyst Note...", 
                type: "person", 
                status: "Watchlist",
                riskScore: 50,
                credibilityScore: 50
            }
        });
    };

    const onPaneClick = useCallback(() => {
        setSelectedEntity(null);
    }, [setSelectedEntity]);

    const filteredNodes = nodes.filter(n => {
        if (activeFilter === "all") return true;
        if (activeFilter === "entity") return n.type === "entity";
        if (activeFilter === "evidence") return n.type === "evidence";
        return true;
    });

    return (
        <div
            ref={canvasRef}
            className="relative flex-1 overflow-hidden bg-[#0a0f1c] canvas-grid"
            onMouseMove={handleMouseMove}
        >
            <CanvasToolbarLeft
                analyzing={analyzing}
                runAIAnalysis={runAIAnalysis}
                addNewEntity={addNewEntity}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                aiMessage={aiMessage}
            />

            <CanvasToolbarRight
                isSearching={isSearching}
                setIsSearching={setIsSearching}
                searchQuery={searchQuery}
                handleSearch={handleSearch}
                collaborators={collaborators}
            />

            <ReactFlow
                nodes={filteredNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.1 }}
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                className="[&_.react-flow__edge-path]:transition-all [&_.react-flow__edge-path]:duration-300"
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
            </ReactFlow>

            <GhostCursors collaborators={collaborators} throttleMs={CURSOR_THROTTLE_MS} />
        </div>
    );
}

export default function InvestigationCanvas() {
    return (
        <ReactFlowProvider>
            <CanvasInner />
        </ReactFlowProvider>
    );
}
