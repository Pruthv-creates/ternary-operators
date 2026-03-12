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
    {
        id: "volkov",
        type: "entity",
        position: { x: 440, y: 150 },
        data: { name: "Alexander Volkov", role: "CEO", type: "person", avatar: "https://i.pravatar.cc/150?u=volkov", status: "Active" },
    }
];

const sharedLabelStyle = { fill: "#60a5fa", fontSize: 10, fontWeight: 500, fontFamily: "sans-serif" };
const dottedEdgeStyle = { stroke: "#06b6d4", strokeWidth: 1.5, strokeDasharray: "3,3" };

const initialEdges: Edge[] = [];

type InvestigationState = {
    nodes: Node[];
    edges: Edge[];
    selectedEntity: Entity | null;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setSelectedEntity: (entity: Entity | null) => void;
    addNode: (node: Node) => void;
    deleteNode: (id: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateNodeData: (id: string, data: any) => void;
    addEdge: (edge: Edge) => void;
    addStickyNote: (position: { x: number, y: number }, text?: string, prefix?: string) => void;
    updateStickyText: (id: string, text: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addAIResult: (result: { nodes: any[], edges: any[] }) => void;
    addEvidenceCard: (title: string, position: { x: number, y: number }) => void;
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
                        opacity: entity ? (isConnected ? 0.7 : 0.1) : (isMoneyFlow ? 0.6 : 1),
                        strokeWidth: isConnected ? (isMoneyFlow ? 6 : 2.5) : (isMoneyFlow ? 6 : (e.style?.strokeWidth || 1.5))
                    }
                };
            }),
        });
    },

    deleteNode: (id: string) => {
        set({
            nodes: get().nodes.filter((n) => n.id !== id),
            edges: get().edges.filter((e) => e.source !== id && e.target !== id),
            selectedEntity: get().selectedEntity?.id === id ? null : get().selectedEntity,
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateNodeData: (id: string, data: any) => {
        set({
            nodes: get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n),
        });
    },

    addStickyNote: (position: { x: number, y: number }, text = "", prefix = "HYPOTHESIS:") => {
        const id = `hyp-${Date.now()}`;
        set({
            nodes: [...get().nodes, {
                id,
                type: "hypothesis",
                position,
                data: {
                    prefix,
                    text: text || "Click to edit...",
                    rotate: Math.random() * 4 - 2 // Random slight rotation
                }
            }]
        });
    },

    addEvidenceCard: (title: string, position: { x: number, y: number }) => {
        const id = `ev-${Date.now()}`;
        set({
            nodes: [...get().nodes, {
                id,
                type: "evidence",
                position,
                data: {
                    item: {
                        id,
                        title,
                        credibility: Math.floor(Math.random() * 40) + 60,
                        timestamp: "Just now",
                        type: "financial",
                        nodeId: "",
                    }
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addAIResult: (result: { nodes: any[], edges: any[] }) => {
        const currentNodes = get().nodes;
        const currentEdges = get().edges;

        const nexusNode = currentNodes.find(n => n.id === "volkov") || { position: { x: 400, y: 300 } };
        const centerX = nexusNode.position.x;
        const centerY = nexusNode.position.y;

        const filteredNodes = result.nodes.filter(n => !currentNodes.find(cn => cn.id === n.id));

        const newNodes: Node[] = filteredNodes.map((n, i) => {
            const angle = (i / filteredNodes.length) * Math.PI * 2;
            const radius = 350 + Math.random() * 50;

            return {
                id: n.id,
                type: "entity",
                position: {
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                },
                data: {
                    name: n.name,
                    role: n.role,
                    type: n.type,
                    status: n.status || "Active",
                    avatar: n.type === "person" ? `https://i.pravatar.cc/150?u=${n.id}` : undefined,
                    isNew: true
                },
            };
        });

        const newEdges: Edge[] = result.edges
            .filter(e => !currentEdges.find(ce => ce.source === e.source && ce.target === e.target))
            .map(e => ({
                id: `e-${e.source}-${e.target}-${Date.now()}`,
                source: e.source,
                target: e.target,
                label: e.label,
                data: { credibilityScore: e.credibilityScore },
                style: e.credibilityScore > 80
                    ? { stroke: "#10b981", strokeWidth: 2 }
                    : { ...dottedEdgeStyle, opacity: 0.6 },
                labelStyle: sharedLabelStyle,
                animated: e.credibilityScore > 70,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: e.credibilityScore > 80 ? "#10b981" : "#06b6d4"
                },
            }));

        set({
            nodes: [...currentNodes, ...newNodes],
            edges: [...currentEdges, ...newEdges],
        });

        setTimeout(() => {
            set({
                nodes: get().nodes.map(n => ({ ...n, data: { ...n.data, isNew: false } }))
            });
        }, 3000);
    },

    addEdge: (edge: Edge) => {
        set({
            edges: [...get().edges, edge],
        });
    },
}));
