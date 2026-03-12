import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  online: boolean;
  lastSeen: Date;
}

export function useCollaborators(caseId: string | null) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!caseId) return;

    setIsLoading(true);
    const channel = supabase.channel(`case-${caseId}-presence`, {
      config: {
        presence: { key: caseId },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const collaboratorList: Collaborator[] = [];

      Object.values(state).forEach((presences: unknown[]) => {
        presences.forEach((presence) => {
          const p = presence as Record<string, unknown>;
          if (p.investigator) {
            collaboratorList.push({
              id: p.id as string,
              name: (p.name as string) || "Anonymous Investigator",
              avatar: p.avatar as string | undefined,
              online: true,
              lastSeen: new Date(p.timestamp as number),
            });
          }
        });
      });

      setCollaborators(collaboratorList);
      setIsLoading(false);
    });

    channel.on("presence", { event: "join" }, () => {
      // Handle new presence join
    });

    channel.on("presence", { event: "leave" }, () => {
      // Handle presence left
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Track this investigator's presence
        await channel.track({
          id: `investigator-${Date.now()}`,
          name: "Investigator",
          investigator: true,
          timestamp: Date.now(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  return { collaborators, isLoading };
}
