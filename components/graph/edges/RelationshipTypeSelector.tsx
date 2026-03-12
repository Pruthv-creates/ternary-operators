import { Sparkles, Loader2 } from "lucide-react";

export const RELATION_TYPES = [
    "related_to", "associates_with", "controls", "owns", "employs", 
    "manages", "reports_to", "funds", "benefits_from", "competes_with", 
    "collaborates_with", "transacts_with", "communicates_with", 
    "located_near", "supply_chain"
];

interface RelationshipTypeSelectorProps {
    selectedType: string;
    onSelect: (type: string) => void;
    onSuggest: () => void;
    isGenerating: boolean;
}

export function RelationshipTypeSelector({ selectedType, onSelect, onSuggest, isGenerating }: RelationshipTypeSelectorProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">Relationship Type</label>
                <button
                    onClick={onSuggest}
                    disabled={isGenerating}
                    className="text-[10px] px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 disabled:opacity-50 border border-blue-500/30 text-blue-400 rounded-lg transition-all flex items-center gap-1.5 font-bold uppercase tracking-wider"
                >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {isGenerating ? "Analyzing..." : "AI Suggest"}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {RELATION_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => onSelect(type)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold capitalize transition-all border ${
                            selectedType === type
                                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40"
                                : "bg-[#111827] text-slate-400 border-[#1e3a5f]/40 hover:border-blue-500/30 hover:text-white"
                        }`}
                    >
                        {type.replace(/_/g, " ")}
                    </button>
                ))}
            </div>
        </div>
    );
}
