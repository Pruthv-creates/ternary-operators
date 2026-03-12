import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useInvestigationStore } from "@/store/investigationStore";

export function useChatBackgroundListener(caseId: string | null) {
    const { incrementUnreadMessagesCount } = useInvestigationStore();

    useEffect(() => {
        if (!caseId) return;

        const channel = supabase
            .channel(`chat-listener:${caseId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `case_id=eq.${caseId}`,
                },
                (payload) => {
                    // This listener runs globally in Topbar
                    // We increment unread count. The store action already checks if chat is open.
                    incrementUnreadMessagesCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [caseId, incrementUnreadMessagesCount]);
}
