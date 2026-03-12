import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserCases, createCase, renameCase } from "@/app/actions/case";
import { useInvestigationStore } from "@/store/investigationStore";
import { useRouter } from "next/navigation";

export function useSidebarCases() {
    const router = useRouter();
    const { loadCaseData, currentCaseId } = useInvestigationStore();
    const [userCases, setUserCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchCases = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const casesData = await getUserCases(user.id);
                setUserCases(casesData);
                
                const lastCaseId = localStorage.getItem("astraeus_last_case_id");
                const caseExists = casesData.find(c => c.id === lastCaseId);

                if (caseExists) {
                    loadCaseData(lastCaseId as string, caseExists.title);
                } else if (casesData.length > 0 && !currentCaseId) {
                    loadCaseData(casesData[0].id, casesData[0].title);
                }
            }
            setLoading(false);
        };
        fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectCase = (caseId: string) => {
        const c = userCases.find(tc => tc.id === caseId);
        localStorage.setItem("astraeus_last_case_id", caseId);
        loadCaseData(caseId, c?.title);
    };

    const handleCreateCase = () => {
        setIsCreateModalOpen(true);
    };

    const handleCreateCaseWithTitle = async (title: string) => {
        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const newCase = await createCase(title, user.id);
                setUserCases([newCase, ...userCases]);
                loadCaseData(newCase.id);
                setIsCreateModalOpen(false);
                router.push("/");
            }
        } catch (error) {
            console.error("Failed to create case:", error);
        } finally {
            setCreating(false);
        }
    };

    const handleRenameCase = async (caseId: string, newTitle: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const result = await renameCase(caseId, newTitle, user.id);
                if (result.success) {
                    setUserCases(userCases.map(c => c.id === caseId ? { ...c, title: newTitle } : c));
                    router.refresh();
                } else {
                    alert("Failed to rename case: " + result.error);
                }
            }
        } catch (error) {
            console.error("Failed to rename case:", error);
        }
    };

    return {
        userCases,
        loading,
        creating,
        currentCaseId,
        isCreateModalOpen,
        setIsCreateModalOpen,
        handleSelectCase,
        handleCreateCase,
        handleCreateCaseWithTitle,
        handleRenameCase
    };
}
