import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Node, Edge } from "@xyflow/react";

export type SyncEvent =
  | { type: "node-move"; id: string; position: { x: number; y: number } }
  | { type: "node-create"; node: Node }
  | { type: "node-update"; id: string; data: Record<string, unknown> }
  | { type: "node-delete"; id: string }
  | { type: "edge-create"; edge: Edge }
  | { type: "edge-delete"; edgeId: string }
  | { type: "graph-full-update"; nodes: Node[]; edges: Edge[] };

export class RealtimeSyncManager {
  private channel: RealtimeChannel | null = null;
  private caseId: string | null = null;
  private callbacks: Map<string, (event: SyncEvent) => void> = new Map();

  async subscribe(
    caseId: string,
    onEvent: (event: SyncEvent) => void,
  ): Promise<void> {
    if (this.caseId === caseId && this.channel) {
      // Already subscribed to the same case
      this.callbacks.set("main", onEvent);
      return;
    }

    // Unsubscribe from previous case
    if (this.channel) {
      await this.channel.unsubscribe();
      supabase.removeChannel(this.channel);
    }

    this.caseId = caseId;
    this.callbacks.set("main", onEvent);

    this.channel = supabase.channel(`case-${caseId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: caseId },
      },
    });

    // Listen for all sync events
    this.channel.on("broadcast", { event: "node-move" }, ({ payload }) => {
      onEvent({ type: "node-move", ...payload });
    });

    this.channel.on("broadcast", { event: "node-create" }, ({ payload }) => {
      onEvent({ type: "node-create", ...payload });
    });

    this.channel.on("broadcast", { event: "node-update" }, ({ payload }) => {
      onEvent({ type: "node-update", ...payload });
    });

    this.channel.on("broadcast", { event: "node-delete" }, ({ payload }) => {
      onEvent({ type: "node-delete", ...payload });
    });

    this.channel.on("broadcast", { event: "edge-create" }, ({ payload }) => {
      onEvent({ type: "edge-create", ...payload });
    });

    this.channel.on("broadcast", { event: "edge-delete" }, ({ payload }) => {
      onEvent({ type: "edge-delete", ...payload });
    });

    // Track presence (who's currently viewing the case)
    this.channel.on("presence", { event: "sync" }, () => {
      const state = this.channel?.presenceState();
      if (state) {
        onEvent({
          type: "graph-full-update",
          nodes: [],
          edges: [],
        });
      }
    });

    await this.channel.subscribe((status) => {
      console.log(`[Realtime] Subscribed to case ${caseId}:`, status);
    });

    // Update presence
    await this.channel.track({ investigator: true, timestamp: Date.now() });
  }

  async broadcast(event: SyncEvent): Promise<void> {
    if (!this.channel) return;

    try {
      await this.channel.send({
        type: "broadcast",
        event: event.type,
        payload: event,
      });
    } catch (error) {
      console.error("[Realtime] Failed to broadcast event:", error);
    }
  }

  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.callbacks.clear();
      this.caseId = null;
    }
  }
}

// Create a singleton instance
export const realtimeSyncManager = new RealtimeSyncManager();
