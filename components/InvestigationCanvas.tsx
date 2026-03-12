"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    NodeMouseHandler,
    useReactFlow,
    ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import EntityNode from "./EntityNode";
import EvidenceNode from "./EvidenceNode";
import HypothesisNode from "./HypothesisNode";
import RelationEdge from "./RelationEdge";
import EdgeEditModal from "./EdgeEditModal";
import { entities } from "@/lib/data";
import { Entity, EntityType } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";
import { Brain, Loader2, Plus, Shield, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import CanvasToolbarLeft from "./canvas/CanvasToolbarLeft";
import CanvasToolbarRight from "./canvas/CanvasToolbarRight";
import GhostCursors from "./canvas/GhostCursors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        addStickyNote,
        currentCaseId,
        collaborators,
        broadcastCursor,
    } = useInvestigationStore();

    const { setCenter } = useReactFlow();
    const canvasRef = useRef<HTMLDivElement>(null);
    const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const CURSOR_THROTTLE_MS = 40; // ~25fps, matches Excalidraw's approach
    const CURSOR_TIMEOUT_MS = 5000; // remove ghost cursor after 5s of no updates

    // Current user metadata for cursor broadcasting
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string; color: string } | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
                const color = colors[Math.abs(data.user.id.charCodeAt(0)) % colors.length];
                setCurrentUser({
                    id: data.user.id,
                    name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Analyst",
                    color,
                });
            }
        });
    }, []);

    // Heartbeat: evict collaborators who haven't sent a cursor update in CURSOR_TIMEOUT_MS
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const { collaborators: current } = useInvestigationStore.getState();
            const pruned = Object.fromEntries(
                Object.entries(current).filter(([, u]) => now - u.lastSeen < CURSOR_TIMEOUT_MS)
            );
            if (Object.keys(pruned).length !== Object.keys(current).length) {
                useInvestigationStore.setState({ collaborators: pruned });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Throttled mouse-move handler on the canvas wrapper
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!currentUser || !canvasRef.current) return;
        if (cursorThrottleRef.current) return;

        cursorThrottleRef.current = setTimeout(() => {
            cursorThrottleRef.current = null;
        }, CURSOR_THROTTLE_MS);

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        broadcastCursor(currentUser.id, currentUser.name, currentUser.color, x, y);
    }, [currentUser, broadcastCursor]);

    const [analyzing, setAnalyzing] = useState(false);
    const [aiMessage, setAiMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [showLegend, setShowLegend] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
    const { deleteEdgeByIds } = useInvestigationStore();

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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) return;
        
        const match = nodes.find(n => 
            (n.data.name as string)?.toLowerCase().includes(query.toLowerCase()) ||
            (n.data.label as string)?.toLowerCase().includes(query.toLowerCase())
        );
        
        if (match) {
            const entity = entities.find(e => e.id === match.id) || {
                id: match.id,
                name: (match.data.name || match.data.label) as string,
                role: match.data.role as string,
                type: (match.data.type || "person") as EntityType,
                avatar: (match.data as any).avatar,
                status: (match.data as any).status,
                credibilityScore: (match.data as any).credibilityScore,
                riskScore: (match.data as any).riskScore,
            };
            setSelectedEntity(entity as Entity);
            
            // Pan to node
            setCenter(match.position.x, match.position.y, { zoom: 1.2, duration: 800 });
        }
    };

    const runAIAnalysis = async () => {
        if (analyzing) return;
        setAnalyzing(true);
        setAiMessage(null);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout for llama3

        try {
            const res = await fetch("/api/ai/analyze", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caseId: currentCaseId }),
                signal: controller.signal
            });
            
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Backend unavailable" }));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            
            const data = await res.json();

            // Check for hard error
            if (data.error && !data.nodes?.length) {
                setAiMessage(`⚠️ AI: ${data.error}`);
                setTimeout(() => setAiMessage(null), 6000);
                return;
            }

            if (data.nodes?.length || data.edges?.length) {
                const oldNodesCount = nodes.length;
                await useInvestigationStore.getState().addAIResult(data);
                const added = useInvestigationStore.getState().nodes.length - oldNodesCount;
                setAiMessage(
                    added > 0
                        ? `✓ AI added ${added} new entit${added === 1 ? "y" : "ies"} to the canvas.`
                        : `✓ AI analysis complete — no new entities found.`
                );
            } else {
                setAiMessage("AI returned no graph data. Try adding more evidence first.");
            }
            setTimeout(() => setAiMessage(null), 6000);
        } catch (error: any) {
            if (error.name === "AbortError") {
                setAiMessage("⏱ Analysis timed out. The AI model may be busy — try again.");
            } else {
                setAiMessage(`⚠️ ${error.message || "AI Analysis failed"}`);
            }
            setTimeout(() => setAiMessage(null), 6000);
        } finally {
            clearTimeout(timeoutId);
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
            {/* UI Overlays — CollaboratorsBar removed, presence shown inline in toolbar */}
            
            {/* Canvas toolbar — Left */}
            <CanvasToolbarLeft
                analyzing={analyzing}
                runAIAnalysis={runAIAnalysis}
                addNewEntity={addNewEntity}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                aiMessage={aiMessage}
            />

            {/* Canvas toolbar — Right */}
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

            {/* Ghost cursor overlay — separate layer so ReactFlow canvas doesn't re-render on moves */}
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
