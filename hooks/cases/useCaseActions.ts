import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCase } from "@/app/actions/case";
import { useInvestigationStore } from "@/store/investigationStore";

export function useCaseActions() {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
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
                localStorage.removeItem("astraeus_last_case_id");
                router.push("/cases");
            } else {
                alert("Failed to delete case: " + result.error);
            }
        } catch (error) {
            alert("Error deleting case: " + String(error));
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        isDeleting,
        handleDeleteCase
    };
}
