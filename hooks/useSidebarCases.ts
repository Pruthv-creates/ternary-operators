import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserCases, createCase } from "@/app/actions/case";
import { useInvestigationStore } from "@/store/investigationStore";

export function useSidebarCases() {
    const { loadCaseData, currentCaseId } = useInvestigationStore();
    const [userCases, setUserCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchCases = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const casesData = await getUserCases(user.id);
                setUserCases(casesData);
                
                const lastCaseId = localStorage.getItem("astraeus_last_case_id");
                const caseExists = casesData.find(c => c.id === lastCaseId);

                if (caseExists) {
                    loadCaseData(lastCaseId as string);
                } else if (casesData.length > 0 && !currentCaseId) {
                    loadCaseData(casesData[0].id);
                }
            }
            setLoading(false);
        };
        fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectCase = (caseId: string) => {
        localStorage.setItem("astraeus_last_case_id", caseId);
        loadCaseData(caseId);
    };

    const handleCreateCase = async () => {
        const title = prompt("Enter Case Title:");
        if (!title) return;

        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const newCase = await createCase(title, user.id);
                setUserCases([newCase, ...userCases]);
                loadCaseData(newCase.id);
            }
        } catch (error) {
            console.error("Failed to create case:", error);
        } finally {
            setCreating(false);
        }
    };

    return {
        userCases,
        loading,
        creating,
        currentCaseId,
        handleSelectCase,
        handleCreateCase
    };
}
