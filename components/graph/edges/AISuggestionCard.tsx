import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AISuggestion } from "@/hooks/graph/useEdgeAI";

interface AISuggestionCardProps {
    suggestion: AISuggestion;
}

export function AISuggestionCard({ suggestion }: AISuggestionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-2xl shadow-inner font-sans"
        >
            <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <Sparkles size={16} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">AI Intelligence Suggestion</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-bold">{suggestion.confidence}% Conf.</span>
                    </div>
                    <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">{suggestion.reasoning}</p>
                </div>
            </div>
        </motion.div>
    );
}
