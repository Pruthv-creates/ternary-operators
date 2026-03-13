"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PromotionType = "entity" | "event";
export type StagingStatus = "pending" | "promoted" | "rejected";

export interface StagingFinding {
  id: string;
  caseId: string;
  type: PromotionType;
  text: string; // The highlighted text
  source: string; // Where it came from (e.g., article title, file name)
  context?: string; // Surrounding text for context
  status: StagingStatus;
  createdAt: string;
  suggestedName?: string;
  suggestedRole?: string;
}

interface StagingState {
  findings: StagingFinding[];
  stagingPanelOpen: boolean;
  setStagingPanelOpen: (open: boolean) => void;
  addFinding: (finding: Omit<StagingFinding, "id" | "createdAt" | "status">) => void;
  promoteFinding: (id: string) => StagingFinding | null;
  rejectFinding: (id: string) => void;
  clearPromoted: () => void;
  getPendingCount: (caseId: string) => number;
}

export const useStagingStore = create<StagingState>()(
  persist(
    (set, get) => ({
      findings: [],
      stagingPanelOpen: false,

      setStagingPanelOpen: (open) => set({ stagingPanelOpen: open }),

      addFinding: (finding) => {
        const newFinding: StagingFinding = {
          ...finding,
          id: `staging-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ findings: [newFinding, ...state.findings] }));
      },

      promoteFinding: (id) => {
        const finding = get().findings.find((f) => f.id === id);
        if (!finding || finding.status !== "pending") return null;
        set((state) => ({
          findings: state.findings.map((f) =>
            f.id === id ? { ...f, status: "promoted" } : f
          ),
        }));
        return finding;
      },

      rejectFinding: (id) => {
        set((state) => ({
          findings: state.findings.map((f) =>
            f.id === id ? { ...f, status: "rejected" } : f
          ),
        }));
      },

      clearPromoted: () => {
        set((state) => ({
          findings: state.findings.filter((f) => f.status === "pending"),
        }));
      },

      getPendingCount: (caseId) => {
        return get().findings.filter(
          (f) => f.caseId === caseId && f.status === "pending"
        ).length;
      },
    }),
    {
      name: "astra-staging-store",
      partialize: (state) => ({ findings: state.findings }),
    }
  )
);
