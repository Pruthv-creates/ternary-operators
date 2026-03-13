import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCase, renameCase } from "@/app/actions/case";
import { useInvestigationStore } from "@/store/investigationStore";

import { toast } from "sonner";

export function useCaseActions() {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const { currentCaseId } = useInvestigationStore();

    const handleDeleteCase = async (fullUser: any) => {
        if (!currentCaseId || !fullUser) return;
        
        if (!window.confirm("Are you sure you want to delete this case? This action cannot be undone.")) {
            return;
        }
        
        setIsDeleting(true);
        try {
            const result = await deleteCase(currentCaseId, fullUser.id);
            if (result.success) {
                // Clear store state so stale case ID is not re-loaded
                useInvestigationStore.setState({ 
                    currentCaseId: null, 
                    nodes: [], 
                    edges: [],
                    selectedEntity: null
                });
                localStorage.removeItem("epsilon3_last_case_id");
                toast.success("Case deleted successfully");
                router.push("/cases");
            } else {
                toast.error("Failed to delete case: " + result.error);
            }
        } catch (error) {
            toast.error("Error deleting case: " + String(error));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRenameCase = async (caseId: string, newTitle: string, fullUser: any) => {
        if (!caseId || !newTitle.trim() || !fullUser) return;
        
        setIsRenaming(true);
        try {
            const result = await renameCase(caseId, newTitle.trim(), fullUser.id);
            if (result.success) {
                toast.success("Case renamed successfully");
                router.refresh();
            } else {
                toast.error("Failed to rename case: " + result.error);
            }
        } catch (error) {
            toast.error("Error renaming case: " + String(error));
        } finally {
            setIsRenaming(false);
        }
    };

    return {
        isDeleting,
        isRenaming,
        handleDeleteCase,
        handleRenameCase
    };
}
