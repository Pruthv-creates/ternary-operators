"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trash2,
  ArrowRight,
  Sparkles,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { useStagingStore, StagingFinding } from "@/store/stagingStore";
import { useInvestigationStore } from "@/store/investigationStore";
import { cn } from "@/lib/utils";

interface StagingAreaPanelProps {
  caseId: string;
}

function FindingCard({ finding }: { finding: StagingFinding }) {
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(finding.suggestedName || finding.text.slice(0, 60));
  const [editedRole, setEditedRole] = useState(finding.suggestedRole || "");

  const { promoteFinding, rejectFinding } = useStagingStore();
  const { addNode, currentCaseId } = useInvestigationStore();

  const handlePromote = () => {
    const f = promoteFinding(finding.id);
    if (!f) return;

    if (f.type === "entity") {
      addNode({
        id: `promoted-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: "entity",
        position: {
          x: 300 + Math.random() * 400,
          y: 200 + Math.random() * 200,
        },
        data: {
          name: editedName || f.text.slice(0, 50),
          role: editedRole || "Intelligence Find",
          type: "person",
          status: "Active",
          riskScore: 45,
          credibilityScore: 60,
          avatar: `https://i.pravatar.cc/150?u=promoted-${finding.id}`,
          sourcedFrom: f.source,
          sourceText: f.text,
        },
      });
    } else {
      // Promote as an event (hypothesis / sticky)
      useInvestigationStore.getState().addStickyNote(
        { x: 300 + Math.random() * 400, y: 300 + Math.random() * 200 },
        `EVENT: ${editedName || f.text.slice(0, 80)}`,
        "EVENT:"
      );
    }
  };

  const typeColor = finding.type === "entity"
    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
    : "bg-amber-500/10 border-amber-500/30 text-amber-400";

  const typeIcon = finding.type === "entity"
    ? <User size={10} />
    : <Calendar size={10} />;

  if (finding.status === "promoted") {
    return (
      <div className="px-4 py-3 flex items-center gap-3 opacity-40">
        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
        <span className="text-[11px] text-slate-400 truncate italic">{editedName}</span>
        <span className="text-[9px] text-emerald-500 ml-auto font-bold uppercase tracking-wider shrink-0">Promoted</span>
      </div>
    );
  }

  if (finding.status === "rejected") {
    return null;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="border-b border-[#1e3a5f]/20 last:border-0"
    >
      <div className="px-4 py-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider shrink-0", typeColor)}>
            {typeIcon}
            {finding.type}
          </span>
          <span className="text-[9px] text-slate-600 font-mono truncate" title={finding.source}>
            {finding.source.length > 30 ? finding.source.slice(0, 30) + "…" : finding.source}
          </span>
        </div>

        {/* Highlighted text */}
        <div className="bg-[#0a0f1c] border border-[#1e3a5f]/30 rounded-lg p-3">
          {editing ? (
            <div className="space-y-2">
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Name / Title"
                className="w-full bg-transparent text-[11px] text-white font-bold border-b border-blue-500/40 pb-1 outline-none placeholder:text-slate-600"
                autoFocus
              />
              <input
                value={editedRole}
                onChange={(e) => setEditedRole(e.target.value)}
                placeholder="Role / Description (optional)"
                className="w-full bg-transparent text-[10px] text-slate-400 border-b border-slate-700/40 pb-1 outline-none placeholder:text-slate-600"
              />
            </div>
          ) : (
            <>
              <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                <span className="text-yellow-300/80 font-bold">❝</span>
                {" "}{finding.text}{" "}
                <span className="text-yellow-300/80 font-bold">❞</span>
              </p>
              {finding.context && finding.context !== finding.text && (
                <p className="text-[9px] text-slate-600 mt-1.5 leading-relaxed line-clamp-2 italic">
                  Context: …{finding.context.replace(finding.text, `[${finding.text}]`)}…
                </p>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setEditing(!editing)}
            className={cn(
              "p-1.5 rounded-lg transition-all text-slate-500 hover:text-blue-400 hover:bg-blue-500/10",
              editing && "text-blue-400 bg-blue-500/10"
            )}
            title="Edit name/role"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={() => rejectFinding(finding.id)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Reject"
          >
            <XCircle size={14} />
          </button>
          <button
            onClick={handlePromote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-900/40"
          >
            Promote to Canvas
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function StagingAreaPanel({ caseId }: StagingAreaPanelProps) {
  const { stagingPanelOpen, setStagingPanelOpen, findings, clearPromoted, getPendingCount } = useStagingStore();
  const pendingCount = getPendingCount(caseId);
  const casefindings = findings.filter((f) => f.caseId === caseId);
  const pending = casefindings.filter((f) => f.status === "pending");
  const promoted = casefindings.filter((f) => f.status === "promoted");

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setStagingPanelOpen(!stagingPanelOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "absolute right-14 top-3 z-20 flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
          stagingPanelOpen
            ? "bg-purple-600/30 border-purple-500/50 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
            : "bg-[#0d1424]/90 border-[#1e3a5f]/50 text-slate-400 hover:text-purple-300 hover:border-purple-500/40 backdrop-blur-sm"
        )}
      >
        <Inbox size={13} />
        Staging
        {pendingCount > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-500 text-white text-[8px] font-black">
            {pendingCount}
          </span>
        )}
        <ChevronRight
          size={12}
          className={cn("transition-transform duration-300", stagingPanelOpen && "rotate-180")}
        />
      </motion.button>

      {/* Slide Panel */}
      <AnimatePresence>
        {stagingPanelOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="absolute right-0 top-0 bottom-0 z-30 w-[360px] bg-[#0a0d18]/95 border-l border-[#1e3a5f]/40 backdrop-blur-xl shadow-[-20px_0_60px_rgba(0,0,0,0.4)] flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]/30 bg-gradient-to-r from-purple-900/10 to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                  <Inbox size={16} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-widest">Staging Area</h2>
                  <p className="text-[9px] text-slate-500 font-medium">Unprocessed findings</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {promoted.length > 0 && (
                  <button
                    onClick={clearPromoted}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Clear promoted"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  onClick={() => setStagingPanelOpen(false)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1e3a5f]/20 bg-[#0d1424]/50 shrink-0">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={11} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">{pending.length}</span>
                <span className="text-[9px] text-slate-600 font-medium">pending</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">{promoted.length}</span>
                <span className="text-[9px] text-slate-600 font-medium">promoted</span>
              </div>
            </div>

            {/* Findings List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {casefindings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                    <Sparkles size={28} className="text-purple-400/60" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">No findings staged</h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Highlight any text in{" "}
                      <span className="text-purple-400 font-bold">News Feed</span> or{" "}
                      <span className="text-purple-400 font-bold">Evidence</span>{" "}
                      and click <em>Promote to Entity</em> or <em>Promote to Event</em>.
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {casefindings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-[#1e3a5f]/20 shrink-0">
              <p className="text-[9px] text-slate-600 text-center leading-relaxed font-medium">
                Highlight text anywhere and select a promotion type.<br />
                Review findings here before pushing to the canvas.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
