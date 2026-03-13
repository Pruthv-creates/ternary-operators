"use client";

import { useState } from "react";
import { X, Sparkles, Trash2, ArrowRight } from "lucide-react";
import { useInvestigationStore } from "@/store/investigationStore";
import { useEdgeAI } from "@/hooks/graph/useEdgeAI";
import { RelationshipTypeSelector } from "./edges/RelationshipTypeSelector";
import { AISuggestionCard } from "./edges/AISuggestionCard";

import { toast } from "sonner";

interface EdgeEditModalProps {
    edgeId: string;
    sourceLabel: string;
    targetLabel: string;
    currentLabel: string;
    onClose: () => void;
    onDeleteEdge?: () => void;
}

export default function EdgeEditModal({
    edgeId,
    sourceLabel,
    targetLabel,
    currentLabel,
    onClose,
    onDeleteEdge,
}: EdgeEditModalProps) {
    const [selectedType, setSelectedType] = useState(currentLabel || "related_to");
    const [credibility, setCredibility] = useState(85);
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { isGenerating, aiSuggestion, generateAISuggestion } = useEdgeAI();
    const updateEdge = useInvestigationStore((state) => state.updateEdge);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateEdge(edgeId, selectedType);
            toast.success("Relationship link updated");
            onClose();
        } catch (error) {
            console.error("Failed to update edge:", error);
            toast.error("Failed to update link");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm("Terminate this relationship link?")) {
            onDeleteEdge?.();
            onClose();
        }
    };

    const handleAIGenerate = async () => {
        try {
            const suggestion = await generateAISuggestion(sourceLabel, targetLabel, notes);
            if (suggestion.confidence > 70) {
                setSelectedType(suggestion.relationship_type);
                setCredibility(Math.min(suggestion.confidence, 100));
                toast.success("AI Intelligence applied to link");
            }
        } catch (e) {
            toast.error("Secure channel timeout. AI suggestion failed.");
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-[#0a0f1c] border border-[#1e3a5f]/50 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] overflow-hidden flex flex-col font-sans">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[#1e3a5f]/30 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Intelligence Link</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">Relationship Definition</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* Visual Preview */}
                    <div className="p-4 bg-[#111827] border border-[#1e3a5f]/40 rounded-2xl flex items-center justify-between gap-4 shadow-inner">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Source</p>
                            <p className="text-sm font-bold text-blue-400 truncate">{sourceLabel}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 group">
                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-wider group-hover:bg-blue-500/20 transition-all">
                                {selectedType.replace(/_/g, " ")}
                            </div>
                            <ArrowRight size={14} className="text-slate-700" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Target</p>
                            <p className="text-sm font-bold text-blue-400 truncate">{targetLabel}</p>
                        </div>
                    </div>

                    {aiSuggestion && <AISuggestionCard suggestion={aiSuggestion} />}

                    <RelationshipTypeSelector 
                        selectedType={selectedType} 
                        onSelect={setSelectedType} 
                        onSuggest={handleAIGenerate} 
                        isGenerating={isGenerating} 
                    />

                    {/* Credibility */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Intelligence Credibility</span>
                            <span className="text-blue-400">{credibility}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={credibility}
                            onChange={(e) => setCredibility(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Discovery Notes */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intelligence Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter classified notes about this link..."
                            className="w-full h-24 bg-[#111827] border border-[#1e3a5f]/40 rounded-2xl px-4 py-3 text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all resize-none shadow-inner"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 bg-black/20 border-t border-[#1e3a5f]/20 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-3 flex-grow-[2] h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                    >
                        <Sparkles size={16} />
                        {isSaving ? "Encrypting..." : "Update Link"}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-12 h-12 flex items-center justify-center bg-red-950/20 border border-red-500/30 text-red-500 rounded-2xl hover:bg-red-500/10 transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 h-12 border border-[#1e3a5f]/50 text-slate-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
