import { useState, useEffect } from "react";
import { getPendingInvitations, acceptInvitation, rejectInvitation } from "@/app/actions/case";

export function useInvitations(userId: string, isOpen: boolean) {
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            loadInvitations();
        }
    }, [isOpen, userId]);

    const loadInvitations = async () => {
        setLoading(true);
        try {
            const pending = await getPendingInvitations(userId);
            setInvitations(pending);
        } catch (e) {
            console.error("Failed to load invitations", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id: string) => {
        setActionId(id);
        try {
            await acceptInvitation(id);
            await loadInvitations();
            window.location.reload(); 
        } catch (e) {
            console.error("Failed to accept", e);
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (id: string) => {
        setActionId(id);
        try {
            await rejectInvitation(id);
            await loadInvitations();
        } catch (e) {
            console.error("Failed to reject", e);
        } finally {
            setActionId(null);
        }
    };

    return {
        invitations,
        loading,
        actionId,
        handleAccept,
        handleReject,
        loadInvitations
    };
}
