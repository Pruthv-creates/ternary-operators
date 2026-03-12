import { useState } from "react";

export interface AISuggestion {
    relationship_type: string;
    confidence: number;
    reasoning: string;
}

export function useEdgeAI() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

    const generateAISuggestion = async (sourceLabel: string, targetLabel: string, context: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch("/api/graph/generate-relation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entity1: sourceLabel,
                    entity2: targetLabel,
                    context,
                }),
            });

            if (!response.ok) throw new Error("Failed to generate suggestion");

            const suggestion = await response.json();
            setAiSuggestion(suggestion);
            return suggestion;
        } catch (error) {
            console.error("Error generating AI suggestion:", error);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        aiSuggestion,
        setAiSuggestion,
        generateAISuggestion
    };
}
