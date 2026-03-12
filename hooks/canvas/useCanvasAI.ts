import { useState } from "react";
import { useInvestigationStore } from "@/store/investigationStore";

export function useCanvasAI() {
    const { currentCaseId, nodes } = useInvestigationStore();
    const [analyzing, setAnalyzing] = useState(false);
    const [aiMessage, setAiMessage] = useState<string | null>(null);

    const runAIAnalysis = async () => {
        if (analyzing) return;
        setAnalyzing(true);
        setAiMessage(null);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
            const res = await fetch("/api/ai/analyze", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caseId: currentCaseId }),
                signal: controller.signal
            });
            
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Backend unavailable" }));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            
            const data = await res.json();

            if (data.error && !data.nodes?.length) {
                setAiMessage(`⚠️ AI: ${data.error}`);
                setTimeout(() => setAiMessage(null), 6000);
                return;
            }

            if (data.nodes?.length || data.edges?.length) {
                const oldNodesCount = nodes.length;
                await useInvestigationStore.getState().addAIResult(data);
                const added = useInvestigationStore.getState().nodes.length - oldNodesCount;
                setAiMessage(
                    added > 0
                        ? `✓ AI added ${added} new entit${added === 1 ? "y" : "ies"} to the canvas.`
                        : `✓ AI analysis complete — no new entities found.`
                );
            } else {
                setAiMessage("AI returned no graph data. Try adding more evidence first.");
            }
            setTimeout(() => setAiMessage(null), 6000);
        } catch (error: any) {
            if (error.name === "AbortError") {
                setAiMessage("⏱ Analysis timed out. The AI model may be busy — try again.");
            } else {
                setAiMessage(`⚠️ ${error.message || "AI Analysis failed"}`);
            }
            setTimeout(() => setAiMessage(null), 6000);
        } finally {
            clearTimeout(timeoutId);
            setAnalyzing(false);
        }
    };

    return {
        analyzing,
        aiMessage,
        runAIAnalysis
    };
}
