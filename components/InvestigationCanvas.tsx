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
import CollaboratorsBar from "./CollaboratorsBar";
import { entities } from "@/lib/data";
import { Entity, EntityType } from "@/lib/data";
import { useInvestigationStore } from "@/store/investigationStore";
import { Brain, Loader2, Plus, Shield, Search, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

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
                useInvestigationStore.getState().addAIResult(data);
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
            {/* UI Overlays */}
            <CollaboratorsBar />
            
            {/* Canvas header */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 shadow-sm">
                        <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                             Investigation Canvas
                        </h2>
                    </div>
                    <button
                        onClick={runAIAnalysis}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/40 group overflow-hidden relative"
                    >
                        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                        <span className="text-[10px] font-black uppercase tracking-wider">AI Analysis</span>
                    </button>
                    <button
                        onClick={addNewEntity}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 hover:bg-slate-700 text-slate-200 transition-all shadow-md group"
                    >
                        <Plus size={14} className="text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Entity</span>
                    </button>

                    <div className="h-4 w-px bg-slate-800/50 mx-1" />

                    <div className="flex bg-[#1e293b]/50 p-1 rounded-lg border border-slate-700/30">
                        {["all", "entity", "evidence"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={cn(
                                    "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                                    activeFilter === f ? "bg-blue-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                {aiMessage && (
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-left-2 transition-all",
                        aiMessage.startsWith("⚠️") || aiMessage.startsWith("⏱")
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : aiMessage.startsWith("✓")
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                        {aiMessage}
                    </div>
                )}
            </div>

            {/* Top Right Header Buttons */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                    onClick={() => setShowLegend(!showLegend)}
                    className={cn(
                        "p-2 rounded-lg border transition-all relative group",
                        showLegend ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-[#1e293b]/80 border-slate-700 text-slate-400 hover:border-slate-500"
                    )}
                >
                    <Shield size={16} />
                    {showLegend && (
                        <div className="absolute top-full right-0 mt-3 w-64 bg-[#0f172a]/95 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-2xl z-50 pointer-events-auto">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Scoring System</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 py-0.5 rounded bg-red-600 text-[8px] font-black text-white text-center">R:87%</div>
                                        <div className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Adverse Risk</div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic">Probability of criminal involvement based on anomalies.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 py-0.5 rounded bg-emerald-500 text-[8px] font-black text-white text-center">C:98%</div>
                                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Credibility</div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic">Trustworthiness of the primary source or record.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => addStickyNote({ x: 400, y: 300 })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fde88a] text-[#422006] hover:bg-[#d6b83f] transition-all shadow-lg font-black text-[10px] uppercase tracking-wider"
                >
                    <Plus size={14} strokeWidth={3} />
                    Sticky
                </button>

                <div className={cn(
                    "flex items-center transition-all duration-300 rounded-lg border",
                    isSearching ? "w-48 bg-[#1e293b] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "w-10 bg-[#1e293b]/80 border-slate-700/50"
                )}>
                    <button 
                        onClick={() => setIsSearching(!isSearching)}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 flex-shrink-0"
                    >
                        <Search size={15} strokeWidth={2.5} />
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

                <div className="flex items-center gap-2 pl-2 border-l border-slate-800 ml-1">
                    <div className="flex -space-x-1.5">
                        <img className="w-8 h-8 rounded-full border-2 border-[#0a0f1c] object-cover ring-1 ring-emerald-500/30" src="https://i.pravatar.cc/150?u=a1" alt="A1" title="Analyst James (Active)" />
                        <img className="w-8 h-8 rounded-full border-2 border-[#0a0f1c] object-cover ring-1 ring-emerald-500/30" src="https://i.pravatar.cc/150?u=a2" alt="A2" title="Analyst Priya (Active)" />
                    </div>
                </div>

                <div 
                    onClick={() => alert("ASTRA Intelligence Portal\nAnalyst: DHARYAJ4N1\nAccess: Project Nexus Administrator")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all font-black text-[11px] text-slate-300 uppercase italic"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Agent
                </div>
            </div>

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
            <div className="absolute inset-0 pointer-events-none z-20">
                {Object.values(collaborators).map((user) => (
                    <div
                        key={user.userId}
                        className="absolute"
                        style={{
                            left: user.x,
                            top: user.y,
                            transition: `left ${CURSOR_THROTTLE_MS}ms linear, top ${CURSOR_THROTTLE_MS}ms linear`,
                        }}
                    >
                        {/* Cursor SVG */}
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.5))` }}
                        >
                            <path
                                d="M0 0 L0 11 L3 8.5 L5.5 14 L7 13.5 L4.5 8 L8 8 Z"
                                fill={user.color}
                                stroke="rgba(0,0,0,0.5)"
                                strokeWidth="1"
                            />
                        </svg>
                        {/* Name tag — positioned to the right of the cursor tip */}
                        <div
                            style={{
                                position: "absolute",
                                top: "0px",
                                left: "18px",
                                backgroundColor: user.color,
                                borderRadius: "4px",
                                padding: "2px 7px",
                                whiteSpace: "nowrap",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                            }}
                        >
                            <span
                                style={{
                                    color: "#fff",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    fontFamily: "sans-serif",
                                    letterSpacing: "0.03em",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                }}
                            >
                                {user.name}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
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
