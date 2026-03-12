"use client";

import { useState } from "react";
import { X, Sparkles, Trash2, Loader2 } from "lucide-react";
import { useInvestigationStore } from "@/store/investigationStore";

interface EdgeEditModalProps {
  edgeId: string;
  sourceLabel: string;
  targetLabel: string;
  currentLabel: string;
  onClose: () => void;
  onDeleteEdge?: () => void;
}

interface AISuggestion {
  relationship_type: string;
  confidence: number;
  reasoning: string;
}

const RELATION_TYPES = [
  "related_to",
  "associates_with",
  "controls",
  "owns",
  "employs",
  "manages",
  "reports_to",
  "funds",
  "benefits_from",
  "competes_with",
  "collaborates_with",
  "transacts_with",
  "communicates_with",
  "located_near",
  "supply_chain",
];

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const updateEdge = useInvestigationStore((state) => state.updateEdge);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEdge(edgeId, selectedType);
      onClose();
    } catch (error) {
      console.error("Failed to update edge:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this relationship?")) {
      onDeleteEdge?.();
      onClose();
    }
  };

  const generateAISuggestion = async () => {
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
          context: notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestion");
      }

      const suggestion = await response.json();
      setAiSuggestion(suggestion);
      
      // Auto-select the suggested type if confidence is high
      if (suggestion.confidence > 70) {
        setSelectedType(suggestion.relationship_type);
        setCredibility(Math.min(suggestion.confidence, 100));
      }
    } catch (error) {
      console.error("Error generating AI suggestion:", error);
      alert("Failed to generate AI suggestion. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1a222f] border border-slate-700/50 rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Edit Relationship</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Relationship Preview */}
        <div className="mb-6 p-4 bg-slate-900/30 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-400 font-medium truncate">{sourceLabel}</span>
            <div className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/40 rounded text-purple-300 text-xs font-mono mx-2">
              {selectedType.replace(/_/g, " ")}
            </div>
            <span className="text-blue-400 font-medium truncate">{targetLabel}</span>
          </div>
        </div>

        {/* AI Suggestion Info */}
        {aiSuggestion && (
          <div className="mb-6 p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-300">AI Suggestion</p>
                <p className="text-xs text-blue-200/70 mt-1">{aiSuggestion.reasoning}</p>
                <p className="text-xs text-blue-300/50 mt-2">Confidence: {aiSuggestion.confidence}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Relationship Type Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-slate-300">
              Relationship Type
            </label>
            <button
              onClick={generateAISuggestion}
              disabled={isGenerating}
              className="text-xs px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 border border-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Suggest with AI
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {RELATION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === type
                    ? "bg-purple-600 text-white border border-purple-500"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50"
                }`}
              >
                {type.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Credibility Score */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Credibility Score: {credibility}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={credibility}
            onChange={(e) => setCredibility(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details about this relationship..."
            className="w-full h-24 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
