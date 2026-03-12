import { AIAction } from "@/lib/data";

interface AIAssistantSuggestionsProps {
    actions: AIAction[];
    handleAsk: (text: string) => void;
}

export function AIAssistantSuggestions({ actions, handleAsk }: AIAssistantSuggestionsProps) {
    if (actions.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Suggested Queries</p>
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={() => handleAsk(action.text)}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-slate-800/80 bg-[#111827]/50 hover:bg-white/5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:border-indigo-500/40 transition-all shadow-sm"
                >
                    {action.text}
                </button>
            ))}
        </div>
    );
}
