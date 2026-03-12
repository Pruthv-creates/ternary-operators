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
import { getCaseGraph, getLocationEvents } from "@/app/actions/case";
import dagre from "dagre";
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
import { realtimeSyncManager, SyncEvent, CursorUser } from "@/lib/realtimeSync";

/** Increment version and attach a random nonce for conflict resolution */
function nextVersion(current: number = 0) {
  return { version: current + 1, versionNonce: Math.floor(Math.random() * 1_000_000) };
}

/** True if incoming (a) should win over stored (b) — higher version, or same version + lower nonce */
function winsConflict(
  aVersion: number,
  aNonce: number,
  bVersion: number,
  bNonce: number,
): boolean {
  if (aVersion !== bVersion) return aVersion > bVersion;
  return aNonce < bNonce; // lower nonce wins (deterministic tiebreak)
}

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
  currentCaseTitle: string | null;
  selectedEntity: Entity | null;
  /** Live cursors of other investigators — keyed by userId */
  collaborators: Record<string, CursorUser>;
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
  addAIResult: (result: { nodes: any[]; edges: any[] }) => Promise<void>;
  addEvidenceCard: (title: string, position: { x: number; y: number }) => void;
  loadCaseData: (caseId: string, title?: string) => Promise<void>;
  aiPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
  toggleAIPanel: () => void;
  broadcastCursor: (userId: string, name: string, color: string, x: number, y: number) => void;

  // Real-time sync methods
  syncNodes: (nodes: Node[]) => void;
  syncEdges: (edges: Edge[]) => void;
  handleRemoteEvent: (event: SyncEvent) => void;
  unreadMessagesCount: number;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  incrementUnreadMessagesCount: () => void;
  resetUnreadMessagesCount: () => void;

  // Geo-Spatial Intelligence
  locationEvents: any[];
  mapMarkers: any[];
  activeMapNodeId: string | null;
  setActiveMapNodeId: (id: string | null) => void;
  highlightedGraphNodeId: string | null;
  setHighlightedGraphNodeId: (id: string | null) => void;
  playbackTime: number;
  setPlaybackTime: (time: number | ((prev: number) => number)) => void;
  isPlaybackPlaying: boolean;
  setIsPlaybackPlaying: (playing: boolean) => void;

  // Auto-Layout
  autoLayout: () => void;
};

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  currentCaseId: null,
  currentCaseTitle: null,
  selectedEntity: null,
  collaborators: {},
  unreadMessagesCount: 0,
  chatOpen: false,
  aiPanelOpen: false,
  setChatOpen: (open) => {
    set({ chatOpen: open });
    if (open) set({ unreadMessagesCount: 0 });
  },
  incrementUnreadMessagesCount: () => {
    if (!get().chatOpen) {
      set((state) => ({ unreadMessagesCount: state.unreadMessagesCount + 1 }));
    }
  },
  resetUnreadMessagesCount: () => set({ unreadMessagesCount: 0 }),

  // Geo-Spatial
  locationEvents: [],
  mapMarkers: [],
  activeMapNodeId: null,
  setActiveMapNodeId: (id) => set({ activeMapNodeId: id }),
  highlightedGraphNodeId: null,
  setHighlightedGraphNodeId: (id) => set({ highlightedGraphNodeId: id }),
  playbackTime: 0,
  setPlaybackTime: (time) => set((state) => ({ 
    playbackTime: typeof time === "function" ? time(state.playbackTime) : time 
  })),
  isPlaybackPlaying: false,
  setIsPlaybackPlaying: (playing) => set({ isPlaybackPlaying: playing }),

  autoLayout: () => {
    const { nodes, edges } = get();
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", marginx: 100, marginy: 100, ranksep: 200, nodesep: 150 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      g.setNode(node.id, { width: 250, height: 100 });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const newNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 125,
          y: nodeWithPosition.y - 50,
        },
      };
    });

    set({ nodes: newNodes });
    // Broadcast new positions
    realtimeSyncManager.broadcast({
      type: "graph-full-update",
      nodes: newNodes,
      edges: edges,
    });
  },

  setAIPanelOpen: (open: boolean) => set({ aiPanelOpen: open }),
  toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),

  loadCaseData: async (caseId: string, title?: string) => {
    const currentCase = get().currentCaseId;
    if (currentCase === caseId) return;

    // Immediately clear for fast UX
    set({ nodes: [], edges: [], currentCaseId: caseId, currentCaseTitle: title || null });

    const { nodes: backendNodes, edges: backendEdges } =
      await getCaseGraph(caseId);
    
    const events = await getLocationEvents(caseId);

    set({
      nodes: backendNodes as any,
      edges: backendEdges as any,
      locationEvents: events,
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
        // Conflict resolution: only apply if incoming version wins
        const existing = currentState.nodes.find((n) => n.id === event.id);
        const existingVersion: number = (existing?.data?.__version as number) ?? 0;
        const existingNonce: number = (existing?.data?.__versionNonce as number) ?? 0;

        if (!existing || winsConflict(event.version, event.versionNonce, existingVersion, existingNonce)) {
          set({
            nodes: currentState.nodes.map((n) =>
              n.id === event.id
                ? { ...n, position: event.position, data: { ...n.data, __version: event.version, __versionNonce: event.versionNonce } }
                : n,
            ),
          });
        }
        break;
      }

      case "node-create": {
        // Avoid duplicates — check by id
        if (!currentState.nodes.find((n) => n.id === event.node.id)) {
          set({ nodes: [...currentState.nodes, event.node] });
        }
        break;
      }

      case "node-update": {
        // Conflict resolution for content edits
        const existing = currentState.nodes.find((n) => n.id === event.id);
        const existingVersion: number = (existing?.data?.__version as number) ?? 0;
        const existingNonce: number = (existing?.data?.__versionNonce as number) ?? 0;

        if (!existing || winsConflict(event.version, event.versionNonce, existingVersion, existingNonce)) {
          set({
            nodes: currentState.nodes.map((n) =>
              n.id === event.id
                ? { ...n, data: { ...n.data, ...event.data, __version: event.version, __versionNonce: event.versionNonce } }
                : n,
            ),
          });
        }
        break;
      }

      case "node-delete": {
        // Tombstone: mark isDeleted instead of removing — prevents re-appearing from late peers
        set({
          nodes: currentState.nodes.map((n) =>
            n.id === event.id ? { ...n, data: { ...n.data, isDeleted: true }, hidden: true } : n,
          ),
          edges: currentState.edges.filter(
            (e) => e.source !== event.id && e.target !== event.id,
          ),
        });
        break;
      }

      case "edge-create": {
        if (
          !currentState.edges.find(
            (e) =>
              e.source === event.edge.source && e.target === event.edge.target,
          )
        ) {
          set({ edges: [...currentState.edges, event.edge] });
        }
        break;
      }

      case "edge-update": {
        set({
          edges: currentState.edges.map((e) =>
            e.id === event.edgeId ? { ...e, label: event.relationshipType } : e,
          ),
        });
        break;
      }

      case "edge-delete": {
        set({ edges: currentState.edges.filter((e) => e.id !== event.edgeId) });
        break;
      }

      case "graph-full-update": {
        if (event.nodes.length > 0) {
          set({ nodes: event.nodes, edges: event.edges });
        }
        break;
      }

      case "cursor-move": {
        // Update this collaborator's cursor position and refresh lastSeen
        set((state) => ({
          collaborators: {
            ...state.collaborators,
            [event.userId]: {
              ...state.collaborators[event.userId],
              userId: event.userId,
              name: event.name,
              color: event.color,
              x: event.x,
              y: event.y,
              lastSeen: Date.now(),
            },
          },
        }));
        break;
      }
      case "presence-sync": {
        const newCollaborators: Record<string, any> = {};
        const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
        
        Object.values(event.users).forEach((u: any) => {
          const existing = currentState.collaborators[u.userId];
          const color = existing?.color || colors[Math.abs(u.userId.charCodeAt(0)) % colors.length];
          
          newCollaborators[u.userId] = {
            userId: u.userId,
            name: u.name,
            color,
            x: existing?.x || 0,
            y: existing?.y || 0,
            lastSeen: existing?.lastSeen || Date.now()
          };
        });
        set({ collaborators: newCollaborators });
        break;
      }
    }
  },

  onNodesChange: (changes: NodeChange[]) => {
    const currentNodes = get().nodes;
    const updatedNodes = applyNodeChanges(changes, currentNodes);
    set({ nodes: updatedNodes });

    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        updateNodePosition(change.id, change.position.x, change.position.y);

        // Get current version and bump it
        const node = currentNodes.find((n) => n.id === change.id);
        const { version, versionNonce } = nextVersion((node?.data?.__version as number) ?? 0);

        // BROADCAST with conflict-resolution metadata
        realtimeSyncManager.broadcast({
          type: "node-move",
          id: change.id,
          position: change.position,
          version,
          versionNonce,
        });

        // Update our own node's version in state so we can compare later
        set({
          nodes: get().nodes.map((n) =>
            n.id === change.id
              ? { ...n, data: { ...n.data, __version: version, __versionNonce: versionNonce } }
              : n,
          ),
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

    // Local: tombstone immediately (hidden: true) so React Flow stops rendering it
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, isDeleted: true }, hidden: true } : n,
      ),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedEntity: get().selectedEntity?.id === id ? null : get().selectedEntity,
    });

    if (caseId) {
      const result = await deleteNodeAction(id, caseId);
      if (result.success) {
        // Broadcast tombstone to peers
        await realtimeSyncManager.broadcast({ type: "node-delete", id });
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
    const node = get().nodes.find((n) => n.id === id);
    const { version, versionNonce } = nextVersion((node?.data?.__version as number) ?? 0);

    const updatedNodes = get().nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...data, __version: version, __versionNonce: versionNonce } } : n,
    );
    const selectedEntity = get().selectedEntity;
    let newSelectedEntity = selectedEntity;
    if (selectedEntity?.id === id) newSelectedEntity = { ...selectedEntity, ...data };

    set({ nodes: updatedNodes, selectedEntity: newSelectedEntity });

    const targetNode = updatedNodes.find((n) => n.id === id);
    if (targetNode) {
      await updateNodeContent(id, targetNode.data);
      await realtimeSyncManager.broadcast({
        type: "node-update",
        id,
        data: targetNode.data,
        version,
        versionNonce,
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

  updateStickyText: async (id: string, text: string) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return;

    const { version, versionNonce } = nextVersion((node.data?.__version as number) ?? 0);
    const newData = { ...node.data, text, __version: version, __versionNonce: versionNonce };

    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: newData } : n,
      ),
    });

    await updateNodeContent(id, newData);
    await realtimeSyncManager.broadcast({
      type: "node-update",
      id,
      data: newData,
      version,
      versionNonce,
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

  addAIResult: async (result: { nodes: any[]; edges: any[] }) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const caseId = get().currentCaseId;

    const nexusNode = currentNodes[0] || { position: { x: 400, y: 300 } };
    const centerX = nexusNode.position.x;
    const centerY = nexusNode.position.y;

    const filteredNodes = result.nodes.filter(
      (n) => !currentNodes.find((cn) => cn.id === n.id),
    );

    // Map AI type strings to Prisma NodeType enum values
    const typeToNodeType = (type: string): string => {
      const t = (type || "person").toLowerCase();
      if (t === "person") return "ENTITY_PERSON";
      if (t === "company" || t === "corporation" || t === "org") return "ENTITY_ORG";
      if (t === "location" || t === "city" || t === "country") return "ENTITY_LOCATION";
      if (t === "bank" || t === "financial" || t === "offshore") return "ENTITY_ORG";
      return "ENTITY_PERSON";
    };

    const newNodes: Node[] = filteredNodes.map((n, i) => {
      const angle = (i / Math.max(filteredNodes.length, 1)) * Math.PI * 2;
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

    // Update in-memory store immediately for instant UI response
    set({
      nodes: [...currentNodes, ...newNodes],
      edges: [...currentEdges, ...newEdges],
    });

    // Persist to database so Cases page stats are accurate
    if (caseId) {
      // Persist all new nodes in parallel
      await Promise.allSettled([
        // Persist all new nodes
        ...newNodes.map(async (n) => {
          try {
            await createNewNode(caseId, {
              id: n.id,
              nodeType: typeToNodeType((n.data as any).type),
              position: n.position,
              data: n.data,
            });
          } catch (e) {
            console.warn("[addAIResult] Failed to persist node:", n.id, e);
          }
        }),
      ]);

      // Persist edges — only after nodes are in DB (use small delay for safety)
      if (newEdges.length > 0) {
        setTimeout(async () => {
          const allNodeIds = new Set(get().nodes.map((n) => n.id));
          for (const e of newEdges) {
            // Only create edge if both endpoints exist in DB
            if (allNodeIds.has(e.source) && allNodeIds.has(e.target)) {
              try {
                await createEdgeAction(
                  caseId,
                  e.source,
                  e.target,
                  (e.label as string) || "related_to",
                );
              } catch (err) {
                console.warn("[addAIResult] Failed to persist edge:", e.id, err);
              }
            }
          }
        }, 1000);
      }

      // Broadcast to other investigators
      try {
        await realtimeSyncManager.broadcast({
          type: "graph-full-update",
          nodes: get().nodes,
          edges: get().edges,
        });
      } catch (e) {
        console.warn("[addAIResult] Broadcast failed:", e);
      }
    }

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
    set({ edges: [...get().edges, edge] });
  },

  broadcastCursor: (userId, name, color, x, y) => {
    realtimeSyncManager.broadcast({ type: "cursor-move", userId, name, color, x, y });
  },
}));
