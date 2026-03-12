import { useState } from "react";

type AIResponse = {
  answer: string;
  sources: string[];
};

export function useAI() {
    const [loading, setLoading] = useState(false);

    async function askAI(question: string): Promise<AIResponse> {
        setLoading(true);
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question }),
            });

            const data: AIResponse = await res.json();
            return data;
        } catch (error) {
            console.error("AI request failed:", error);

            return {
                answer: "Astra AI backend connection failed. Ensure your API is responding correctly.",
                sources: [],
            };
        } finally {
            setLoading(false);
        }
    }

    return { askAI, loading };
}
