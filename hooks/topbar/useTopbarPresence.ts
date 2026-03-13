import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getCaseInvestigators } from "@/app/actions/case";
import { useInvestigationStore } from "@/store/investigationStore";

export interface PresenceUser {
    id: string;
    initials: string;
    name: string;
    color: string;
}

export function useTopbarPresence(currentCaseId: string | null) {
    const [userEmail, setUserEmail] = useState<string>("Agent");
    const [fullUser, setFullUser] = useState<any>(null);
    const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
    const [validInvestigators, setValidInvestigators] = useState<string[]>([]);
    const { setCurrentUser } = useInvestigationStore();

    useEffect(() => {
        if (!currentCaseId) {
            setValidInvestigators([]);
            return;
        }
        getCaseInvestigators(currentCaseId).then(setValidInvestigators);
    }, [currentCaseId]);

    useEffect(() => {
        // 1. Get current user
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Agent";
                setUserEmail(name);
                const userData = {
                    id: data.user.id,
                    name,
                    email: data.user.email || "",
                    avatar: data.user.user_metadata?.avatar_url
                };
                setFullUser(userData);
                setCurrentUser(userData);
            }
        });

        // 2. Setup Presence
        const channel = supabase.channel("collaboration", {
            config: {
                presence: {
                    key: "investigators",
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const allOnline = Object.values(state).flat().map((p: any) => ({
                    id: p.user_id,
                    initials: (p.name || "A").substring(0, 2).toUpperCase(),
                    name: p.name || "Agent",
                    color: p.color || "bg-blue-500",
                }));

                // Filter by investigators on this case
                if (currentCaseId && validInvestigators.length > 0) {
                    setPresenceUsers(allOnline.filter(u => validInvestigators.includes(u.id)));
                } else {
                    setPresenceUsers(allOnline);
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
                        const randomColor = colors[Math.floor(Math.random() * colors.length)];
                        
                        await channel.track({
                            user_id: user.id,
                            name: user.user_metadata?.full_name || user.email?.split("@")[0],
                            color: randomColor,
                        });
                    }
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentCaseId, validInvestigators]);

    return {
        userEmail,
        fullUser,
        presenceUsers
    };
}
