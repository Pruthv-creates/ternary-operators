import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface Message {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string;
    sender_avatar?: string;
    created_at: string;
}

export function useTeamChat(caseId: string, currentUser: { id: string, name: string, avatar?: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("case_id", caseId)
                .order("created_at", { ascending: true });

            if (fetchError) {
                console.error("Supabase fetch error:", fetchError);
                throw fetchError;
            }
            setMessages(data || []);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching messages:", err);
            setError(`Failed to load message history: ${err.message || "Unauthorized Access"}`);
        }
    }, [caseId]);

    useEffect(() => {
        if (!caseId) return;

        const channel = supabase
            .channel(`case-chat:${caseId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `case_id=eq.${caseId}`,
                },
                (payload) => {
                    setMessages((prev) => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new as Message];
                    });
                }
            )
            .subscribe();

        fetchMessages();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [caseId, fetchMessages]);

    async function sendMessage(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !caseId) return;

        setLoading(true);
        setError(null);
        
        try {
            const { error: sendError } = await supabase.from("chat_messages").insert([
                {
                    id: crypto.randomUUID(),
                    content: newMessage.trim(),
                    case_id: caseId,
                    sender_id: currentUser.id,
                    sender_name: currentUser.name,
                    sender_avatar: currentUser.avatar || null,
                },
            ]);

            if (sendError) throw sendError;
            setNewMessage("");
        } catch (err: any) {
            console.error("Error sending message:", err);
            setError(`Transmission Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    return {
        messages,
        newMessage,
        setNewMessage,
        loading,
        error,
        sendMessage
    };
}
