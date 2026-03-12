import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { createInvitation, searchAgents } from "@/app/actions/case";

export interface Agent {
    id: string;
    name: string | null;
    email: string;
}

export function useCollaboratorInvite(caseId: string | null) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Agent[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<Agent | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setCurrentUserId(data.user.id);
        });
    }, []);

    useEffect(() => {
        if (!query || query.length < 2 || selected) {
            if (!selected) setResults([]);
            return;
        }
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        setSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const found = await searchAgents(query, currentUserId || "");
                setResults(found);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    }, [query, currentUserId, selected]);

    const handleInvite = async () => {
        if (!caseId || !selected || !currentUserId) return;
        setStatus("loading");
        try {
            await createInvitation(caseId, currentUserId, selected.id);
            setStatus("success");
        } catch (e: any) {
            setStatus("error");
            setErrorMsg(e.message || "Failed to send invitation.");
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setSelected(null);
        setStatus("idle");
        setErrorMsg("");
    };

    return {
        isOpen,
        setIsOpen,
        query,
        setQuery,
        results,
        searching,
        selected,
        setSelected,
        status,
        errorMsg,
        handleInvite,
        handleClose
    };
}
