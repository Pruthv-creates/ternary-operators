import { create } from "zustand";
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
} from "@xyflow/react";
import { Entity, evidenceItems } from "@/lib/data";

const initialNodes: Node[] = [
    // Entities
    {
        id: "volkov",
        type: "entity",
        position: { x: 440, y: 150 },
        data: { name: "Alexander Volkov", role: "CEO", type: "person", avatar: "https://i.pravatar.cc/150?u=volkov" },
    },
    {
        id: "saram",
        type: "entity",
        position: { x: 60, y: 300 },
        data: { name: "Saram.", role: "", type: "person", avatar: "https://i.pravatar.cc/150?u=saram" },
    },
    {
        id: "rashid",
        type: "entity",
        position: { x: 180, y: 440 },
        data: { name: "Ahmad Rashid", role: "SHARENOCDER", type: "person", avatar: "https://i.pravatar.cc/150?u=rashid" },
    },
    {
        id: "petrova",
        type: "entity",
        position: { x: 230, y: 620 },
        data: { name: "Elena Petrova", role: "SHAREHOLDER", type: "person", avatar: "https://i.pravatar.cc/150?u=petrova" },
    },
    {
        id: "synergy",
        type: "entity",
        position: { x: 440, y: 400 },
        data: { name: "Synergy Corp", role: "Company", type: "company" },
    },
    {
        id: "alpha-bank",
        type: "entity",
        position: { x: 740, y: 400 },
        data: { name: "Alpha Bank", role: "Bank Account", type: "bank" },
    },
    {
        id: "offshore",
        type: "entity",
        position: { x: 440, y: 640 },
        data: { name: "Offshore Entity", role: "Seychelles", type: "offshore" },
    },
    {
        id: "london",
        type: "entity",
        position: { x: 700, y: 620 },
        data: { name: "Location: London Office", role: "", type: "location" },
    },

    // Evidence Cards
    {
        id: "ev1",
        type: "evidence",
        position: { x: 120, y: 120 },
        data: { item: evidenceItems[0] }, // Financial Records
    },
    {
        id: "ev2",
        type: "evidence",
        position: { x: 620, y: 120 },
        data: { item: evidenceItems[1] }, // Confidential Email
    },
    {
        id: "ev3",
        type: "evidence",
        position: { x: 800, y: 320 },
        data: { item: evidenceItems[2] }, // Travel Logs
    },

    // Hypothesis Stickies
    {
        id: "hyp1",
        type: "hypothesis",
        position: { x: 40, y: 650 },
        data: { prefix: "HYPOTHESIS:", text: "Shell company used for laundering?", rotate: -1 },
    },
    {
        id: "hyp2",
        type: "hypothesis",
        position: { x: 860, y: 90 },
        data: { prefix: "HYPOTHESIS:", text: "Sheli company used for laundering?", rotate: 2 },
    },
    {
        id: "hyp3",
        type: "hypothesis",
        position: { x: 860, y: 640 },
        data: { prefix: "TIMELINE GAP:", text: "July 2E23 -\nAI ALERT", rotate: -2 },
    },
];

const sharedLabelStyle = { fill: "#60a5fa", fontSize: 10, fontWeight: 500, fontFamily: "sans-serif" };
const dottedEdgeStyle = { stroke: "#06b6d4", strokeWidth: 1.5, strokeDasharray: "3,3" };

const initialEdges: Edge[] = [
    // Evidence to Entities
    {
        id: "e-ev1-volkov",
        source: "ev1",
        target: "volkov",
        style: { stroke: "#3b82f6", strokeWidth: 1 },
    },
    {
        id: "e-ev1-saram",
        source: "ev1",
        target: "saram",
        style: { stroke: "#3b82f6", strokeWidth: 1 },
    },
    {
        id: "e-ev1-synergy",
        source: "ev1",
        target: "synergy",
        style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
    },
    {
        id: "e-ev2-volkov",
        source: "ev2",
        target: "volkov",
        style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
    },
    {
        id: "e-ev2-petrova",
        source: "ev2",
        target: "petrova",
        style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
    },
    {
        id: "e-ev3-alpha",
        source: "ev3",
        target: "alpha-bank",
        style: { stroke: "#3b82f6", strokeWidth: 1.5 },
    },

    // Entity to Entity Edges
    {
        id: "e-volkov-synergy",
        source: "volkov",
        target: "synergy",
        label: "Owner",
        style: { stroke: "#8b5cf6", strokeWidth: 2 },
        labelStyle: { fill: "#a78bfa", fontSize: 11, fontWeight: 600, background: "transparent" },
        labelBgStyle: { fill: "transparent" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
    },
    {
        id: "e-synergy-bank",
        source: "synergy",
        target: "alpha-bank",
        label: "Money Flow: $12.5M",
        style: { stroke: "#3b82f6", strokeWidth: 6, opacity: 0.6 },
        labelStyle: { fill: "#60a5fa", fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: "transparent" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
        animated: true,
    },
    {
        id: "e-rashid-synergy",
        source: "rashid",
        target: "synergy",
        label: "AI Suggested Connection",
        style: dottedEdgeStyle,
        labelStyle: sharedLabelStyle,
        labelBgStyle: { fill: "transparent" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
    },
    {
        id: "e-petrova-synergy",
        source: "petrova",
        target: "synergy",
        label: "84% Suggestion\n84% Suggestion",
        style: dottedEdgeStyle,
        labelStyle: sharedLabelStyle,
        labelBgStyle: { fill: "transparent" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
    },
    {
        id: "e-offshore-synergy",
        source: "offshore",
        target: "synergy",
        label: "Alt Suggestion\n84% Suggestion",
        style: dottedEdgeStyle,
        labelStyle: sharedLabelStyle,
        labelBgStyle: { fill: "transparent" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
    },
    {
        id: "e-london-synergy",
        source: "london",
        target: "synergy",
        style: dottedEdgeStyle,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
    },
];

type InvestigationState = {
    nodes: Node[];
    edges: Edge[];
    selectedEntity: Entity | null;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setSelectedEntity: (entity: Entity | null) => void;
    addNode: (node: Node) => void;
    addEdge: (edge: Edge) => void;
    addStickyNote: (position: { x: number, y: number }) => void;
    updateStickyText: (id: string, text: string) => void;
};

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    selectedEntity: null,

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    setSelectedEntity: (entity: Entity | null) => {
        set({
            selectedEntity: entity,
            // Update node selected state
            nodes: get().nodes.map((n) => ({
                ...n,
                data: { ...n.data, selected: entity?.id === n.id },
            })),
            // Update edges to glow if they connect to the selected entity
            edges: get().edges.map((e) => {
                const isConnected = entity ? (e.source === entity.id || e.target === entity.id) : false;
                const isMoneyFlow = typeof e.label === "string" && e.label.includes("Money Flow");

                return {
                    ...e,
                    animated: isConnected || isMoneyFlow,
                    className: isConnected ? "animated-edge-glow" : "",
                    style: {
                        ...e.style,
                        opacity: entity ? (isConnected ? 1 : 0.2) : (isMoneyFlow ? 0.6 : 1),
                        strokeWidth: isConnected ? (isMoneyFlow ? 6 : 2.5) : (isMoneyFlow ? 6 : (e.style?.strokeWidth || 1.5))
                    }
                };
            }),
        });
    },

    addStickyNote: (position: { x: number, y: number }) => {
        const id = `hyp-${Date.now()}`;
        set({
            nodes: [...get().nodes, {
                id,
                type: "hypothesis",
                position,
                data: {
                    prefix: "NEW HYPOTHESIS:",
                    text: "",
                    rotate: Math.random() * 4 - 2 // Random slight rotation
                }
            }]
        });
    },

    updateStickyText: (id: string, text: string) => {
        set({
            nodes: get().nodes.map((n) =>
                n.id === id ? { ...n, data: { ...n.data, text } } : n
            ),
        });
    },

    addNode: (node: Node) => {
        set({
            nodes: [...get().nodes, node],
        });
    },

    addEdge: (edge: Edge) => {
        set({
            edges: [...get().edges, edge],
        });
    },
}));
