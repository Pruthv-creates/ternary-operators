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
import { Entity } from "@/lib/data";
import { getCaseGraph } from "@/app/actions/case";
import {
  updateNodePosition,
  createNewNode,
  updateNodeContent,
  deleteNodeAction,
  createEdgeAction,
  updateEdgeAction,
  deleteEdgeAction,
} from "@/actions/nodes";
import { supabase } from "@/lib/supabase";
import { realtimeSyncManager, SyncEvent } from "@/lib/realtimeSync";

const initialNodes: Node[] = [
  {
    id: "volkov",
    type: "entity",
    position: { x: 440, y: 150 },
    data: {
      name: "Alexander Volkov",
      role: "CEO",
      type: "person",
      avatar: "https://i.pravatar.cc/150?u=volkov",
      status: "Active",
      riskScore: 87,
      credibilityScore: 65,
    },
  },
];

const sharedLabelStyle = {
  fill: "#60a5fa",
  fontSize: 10,
  fontWeight: 500,
  fontFamily: "sans-serif",
};
const dottedEdgeStyle = {
  stroke: "#06b6d4",
  strokeWidth: 1.5,
  strokeDasharray: "3,3",
};

type InvestigationState = {
  nodes: Node[];
  edges: Edge[];
  currentCaseId: string | null;
  selectedEntity: Entity | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedEntity: (entity: Entity | null) => void;
  addNode: (node: Node) => void;
  deleteNode: (id: string) => void;
  updateNodeData: (id: string, data: any) => void;
  addEdge: (edge: Edge) => void;
  updateEdge: (edgeId: string, relationshipType: string) => void;
  deleteEdgeByIds: (sourceId: string, targetId: string) => void;
  addStickyNote: (
    position: { x: number; y: number },
    text?: string,
    prefix?: string,
  ) => void;
  updateStickyText: (id: string, text: string) => void;
  addAIResult: (result: { nodes: any[]; edges: any[] }) => void;
  addEvidenceCard: (title: string, position: { x: number; y: number }) => void;
  loadCaseData: (caseId: string) => Promise<void>;
  aiPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
  toggleAIPanel: () => void;

  // Real-time sync methods
  syncNodes: (nodes: Node[]) => void;
  syncEdges: (edges: Edge[]) => void;
  handleRemoteEvent: (event: SyncEvent) => void;
};

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  currentCaseId: null,
  selectedEntity: null,
  aiPanelOpen: false,

  setAIPanelOpen: (open: boolean) => set({ aiPanelOpen: open }),
  toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),

  loadCaseData: async (caseId: string) => {
    const currentCase = get().currentCaseId;
    if (currentCase === caseId) return;

    // Immediately clear for fast UX
    set({ nodes: [], edges: [], currentCaseId: caseId });

    const { nodes: backendNodes, edges: backendEdges } =
      await getCaseGraph(caseId);
    set({
      nodes: backendNodes as any,
      edges: backendEdges as any,
    });

    // Subscribe to real-time updates
    await realtimeSyncManager.subscribe(caseId, (event) => {
      get().handleRemoteEvent(event);
    });
  },

  syncNodes: (nodes: Node[]) => set({ nodes }),
  syncEdges: (edges: Edge[]) => set({ edges }),

  handleRemoteEvent: (event: SyncEvent) => {
    const currentState = get();

    switch (event.type) {
      case "node-move": {
        const updatedNodes = currentState.nodes.map((n) =>
          n.id === event.id
            ? {
                ...n,
                position: event.position,
              }
            : n,
        );
        set({ nodes: updatedNodes });
        break;
      }

      case "node-create": {
        // Avoid duplicates
        if (!currentState.nodes.find((n) => n.id === event.node.id)) {
          set({
            nodes: [...currentState.nodes, event.node],
          });
        }
        break;
      }

      case "node-update": {
        const updatedNodes = currentState.nodes.map((n) =>
          n.id === event.id
            ? {
                ...n,
                data: { ...n.data, ...event.data },
              }
            : n,
        );
        set({ nodes: updatedNodes });
        break;
      }

      case "node-delete": {
        set({
          nodes: currentState.nodes.filter((n) => n.id !== event.id),
          edges: currentState.edges.filter(
            (e) => e.source !== event.id && e.target !== event.id,
          ),
        });
        break;
      }

      case "edge-create": {
        // Avoid duplicates
        if (
          !currentState.edges.find(
            (e) =>
              e.source === event.edge.source && e.target === event.edge.target,
          )
        ) {
          set({
            edges: [...currentState.edges, event.edge],
          });
        }
        break;
      }

      case "edge-update": {
        const updatedEdges = currentState.edges.map((e) =>
          e.id === event.edgeId
            ? {
                ...e,
                label: event.relationshipType,
              }
            : e,
        );
        set({ edges: updatedEdges });
        break;
      }

      case "edge-delete": {
        set({
          edges: currentState.edges.filter((e) => e.id !== event.edgeId),
        });
        break;
      }

      case "graph-full-update": {
        // Full refresh (optional - usually not needed)
        if (event.nodes.length > 0) {
          set({
            nodes: event.nodes,
            edges: event.edges,
          });
        }
        break;
      }
    }
  },

  onNodesChange: (changes: NodeChange[]) => {
    const currentNodes = get().nodes;
    const updatedNodes = applyNodeChanges(changes, currentNodes);
    set({ nodes: updatedNodes });

    // PERSIST POSITIONS AND BROADCAST!
    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        updateNodePosition(change.id, change.position.x, change.position.y);

        // BROADCAST position via real-time sync
        realtimeSyncManager.broadcast({
          type: "node-move",
          id: change.id,
          position: change.position,
        });
      }
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    try {
      const caseId = get().currentCaseId;
      if (!caseId) {
        console.error("[onConnect] No case ID found");
        return;
      }

      if (!connection.source || !connection.target) {
        console.error(
          "[onConnect] Invalid connection: missing source or target",
          connection,
        );
        return;
      }

      console.log("[onConnect] Creating edge:", {
        source: connection.source,
        target: connection.target,
      });

      // Fire and forget - don't await, just trigger async operations
      (async () => {
        try {
          // Persist to database FIRST to get proper ID
          const result = await createEdgeAction(
            caseId,
            connection.source || "",
            connection.target || "",
            "related_to",
          );

          console.log("[onConnect] Edge creation result:", result);

          if (!result.success) {
            if (result.duplicate) {
              console.warn("[onConnect] Edge already exists");
            } else {
              console.error("[onConnect] Failed to create edge");
            }
            return;
          }

          if (!result.edge) {
            console.error("[onConnect] No edge returned from server");
            return;
          }

          // Create edge with database ID and proper styling
          const dbEdge = result.edge;
          const edge: Edge = {
            id: dbEdge.id,
            source: dbEdge.source || dbEdge.sourceId,
            target: dbEdge.target || dbEdge.targetId,
            type: "relation",
            label: dbEdge.label || dbEdge.relationshipType || "related_to",
            data: {
              credibilityScore: 85,
              relationshipType: dbEdge.relationshipType,
            },
            style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
            animated: false,
            labelStyle: { fill: "#60a5fa", fontSize: 10, fontWeight: 500 },
            markerEnd: { type: "arrowclosed", color: "#8b5cf6" },
          };

          console.log("[onConnect] Adding edge to local state:", edge);

          // Add to local state
          set({
            edges: addEdge(edge, get().edges),
          });

          // Broadcast to other investigators
          await realtimeSyncManager.broadcast({
            type: "edge-create",
            edge,
          });

          console.log("[onConnect] Edge created and broadcast successfully");
        } catch (error) {
          console.error("[onConnect] Exception:", error);
        }
      })();
    } catch (error) {
      console.error("[onConnect] Outer exception:", error);
    }
  },

  setSelectedEntity: (entity: Entity | null) => {
    set({
      selectedEntity: entity,
      nodes: get().nodes.map((n) => ({
        ...n,
        data: { ...n.data, selected: entity?.id === n.id },
      })),
      edges: get().edges.map((e) => {
        const isConnected = entity
          ? e.source === entity.id || e.target === entity.id
          : false;
        const isMoneyFlow =
          typeof e.label === "string" && e.label.includes("Money Flow");

        return {
          ...e,
          animated: isConnected || isMoneyFlow,
          className: isConnected ? "animated-edge-glow" : "",
          style: {
            ...e.style,
            opacity: entity ? (isConnected ? 0.7 : 0.1) : isMoneyFlow ? 0.6 : 1,
            strokeWidth: isConnected
              ? isMoneyFlow
                ? 6
                : 2.5
              : isMoneyFlow
                ? 6
                : e.style?.strokeWidth || 1.5,
          },
        };
      }),
    });
  },

  deleteNode: async (id: string) => {
    const caseId = get().currentCaseId;

    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedEntity:
        get().selectedEntity?.id === id ? null : get().selectedEntity,
    });

    if (caseId) {
      const result = await deleteNodeAction(id, caseId);
      if (result.success) {
        // Broadcast deletion
        await realtimeSyncManager.broadcast({
          type: "node-delete",
          id,
        });
      }
    }
  },

  deleteEdgeByIds: async (sourceId: string, targetId: string) => {
    const caseId = get().currentCaseId;
    const edge = get().edges.find(
      (e) => e.source === sourceId && e.target === targetId,
    );

    if (!edge) return;

    set({
      edges: get().edges.filter((e) => e.id !== edge.id),
    });

    if (caseId && edge.id) {
      const result = await deleteEdgeAction(edge.id, caseId);
      if (result.success) {
        // Broadcast deletion
        await realtimeSyncManager.broadcast({
          type: "edge-delete",
          edgeId: edge.id,
        });
      }
    }
  },

  updateEdge: async (edgeId: string, relationshipType: string) => {
    const caseId = get().currentCaseId;
    const edge = get().edges.find((e) => e.id === edgeId);

    if (!edge) return;

    // Optimistic update
    const updatedEdges = get().edges.map((e) =>
      e.id === edgeId
        ? {
            ...e,
            label: relationshipType,
            data: { ...e.data, relationshipType },
          }
        : e,
    );
    set({ edges: updatedEdges });

    // Update in database
    if (caseId && edgeId) {
      const result = await updateEdgeAction(edgeId, relationshipType);
      if (result.success) {
        // Broadcast update
        await realtimeSyncManager.broadcast({
          type: "edge-update",
          edgeId,
          relationshipType,
        });
      }
    }
  },

  updateNodeData: async (id: string, data: any) => {
    const updatedNodes = get().nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
    );
    const selectedEntity = get().selectedEntity;
    let newSelectedEntity = selectedEntity;

    if (selectedEntity?.id === id) {
      newSelectedEntity = {
        ...selectedEntity,
        ...data,
      };
    }

    set({
      nodes: updatedNodes,
      selectedEntity: newSelectedEntity,
    });

    const targetNode = updatedNodes.find((n) => n.id === id);
    if (targetNode) {
      await updateNodeContent(id, targetNode.data);

      // Broadcast update
      await realtimeSyncManager.broadcast({
        type: "node-update",
        id,
        data: targetNode.data,
      });
    }
  },

  addStickyNote: async (
    position: { x: number; y: number },
    text = "",
    prefix = "HYPOTHESIS:",
  ) => {
    const caseId = get().currentCaseId;
    if (!caseId) return;

    const id = `hyp-${Date.now()}`;
    const newNode: Node = {
      id,
      type: "hypothesis",
      position,
      data: {
        prefix,
        text: text || "Click to edit...",
        rotate: Math.random() * 4 - 2,
      },
    };

    set({ nodes: [...get().nodes, newNode] });

    const result = await createNewNode(caseId, newNode);
    if (result.success) {
      // Broadcast creation
      await realtimeSyncManager.broadcast({
        type: "node-create",
        node: newNode,
      });
    }
  },

  addEvidenceCard: async (
    title: string,
    position: { x: number; y: number },
  ) => {
    const caseId = get().currentCaseId;
    if (!caseId) return;

    const id = `ev-${Date.now()}`;
    const newNode: Node = {
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
        },
      },
    };

    set({ nodes: [...get().nodes, newNode] });

    const result = await createNewNode(caseId, {
      ...newNode,
      nodeType: "DOCUMENT",
    });
    if (result.success) {
      // Broadcast creation
      await realtimeSyncManager.broadcast({
        type: "node-create",
        node: newNode,
      });
    }
  },

  updateStickyText: (id: string, text: string) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, text } } : n,
      ),
    });
  },

  addNode: async (node: Node) => {
    const caseId = get().currentCaseId;
    if (!caseId) return;

    set({
      nodes: [...get().nodes, node],
    });

    let prismaType = "ENTITY_PERSON";
    if (node.data.type === "company" || node.data.type === "offshore")
      prismaType = "ENTITY_ORG";
    else if (node.data.type === "location") prismaType = "ENTITY_LOCATION";
    else if (node.data.type === "bank") prismaType = "ENTITY_PERSON";

    const nodeWithPrismaType = {
      ...node,
      nodeType: prismaType,
    };

    const result = await createNewNode(caseId, nodeWithPrismaType);
    if (result.success) {
      // Broadcast creation
      await realtimeSyncManager.broadcast({
        type: "node-create",
        node,
      });
    }
  },

  addAIResult: (result: { nodes: any[]; edges: any[] }) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;

    const nexusNode = currentNodes[0] || { position: { x: 400, y: 300 } };
    const centerX = nexusNode.position.x;
    const centerY = nexusNode.position.y;

    const filteredNodes = result.nodes.filter(
      (n) => !currentNodes.find((cn) => cn.id === n.id),
    );

    const newNodes: Node[] = filteredNodes.map((n, i) => {
      const angle = (i / filteredNodes.length) * Math.PI * 2;
      const radius = 350 + Math.random() * 50;

      return {
        id: n.id,
        type: "entity",
        position: {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        },
        data: {
          name: n.name,
          role: n.role,
          type: n.type,
          status: n.status || "Active",
          credibilityScore: n.credibilityScore,
          riskScore: n.riskScore,
          avatar:
            n.type === "person"
              ? `https://i.pravatar.cc/150?u=${n.id}`
              : undefined,
          isNew: true,
        },
      };
    });

    const newEdges: Edge[] = result.edges
      .filter(
        (e) =>
          !currentEdges.find(
            (ce) => ce.source === e.source && ce.target === e.target,
          ),
      )
      .map((e) => ({
        id: `e-${e.source}-${e.target}-${Date.now()}`,
        source: e.source,
        target: e.target,
        type: "relation",
        label: e.label,
        data: { credibilityScore: e.credibilityScore },
        style:
          e.credibilityScore > 80
            ? { stroke: "#10b981", strokeWidth: 2 }
            : { ...dottedEdgeStyle, opacity: 0.6 },
        animated: e.credibilityScore > 70,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.credibilityScore > 80 ? "#10b981" : "#06b6d4",
        },
      }));

    set({
      nodes: [...currentNodes, ...newNodes],
      edges: [...currentEdges, ...newEdges],
    });

    setTimeout(() => {
      set({
        nodes: get().nodes.map((n) => ({
          ...n,
          data: { ...n.data, isNew: false },
        })),
      });
    }, 3000);
  },

  addEdge: (edge: Edge) => {
    set({
      edges: [...get().edges, edge],
    });
  },
}));
