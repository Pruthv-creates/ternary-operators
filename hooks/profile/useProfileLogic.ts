import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getPendingInvitations } from "@/app/actions/case";

export function useProfileLogic(user: { id: string } | null, isOpen: boolean) {
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loadingInvites, setLoadingInvites] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);

    useEffect(() => {
        if (isOpen && user?.id) {
            loadInvitations();
        }
    }, [isOpen, user?.id]);

    const loadInvitations = async () => {
        if (!user?.id) return;
        setLoadingInvites(true);
        try {
            const pending = await getPendingInvitations(user.id);
            setInvitations(pending);
        } catch (e) {
            console.error("Failed to load invitations", e);
        } finally {
            setLoadingInvites(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return {
        invitations,
        loadingInvites,
        wizardOpen,
        setWizardOpen,
        loadInvitations,
        handleLogout
    };
}
