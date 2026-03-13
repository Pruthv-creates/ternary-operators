"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Calendar, Inbox, X } from "lucide-react";
import { useStagingStore, PromotionType } from "@/store/stagingStore";
import { useInvestigationStore } from "@/store/investigationStore";

interface SelectionCoords {
  x: number;
  y: number;
}

interface TextHighlightPromoterProps {
  source: string;
  children: React.ReactNode;
  className?: string;
}

export function TextHighlightPromoter({
  source,
  children,
  className,
}: TextHighlightPromoterProps) {
  const [selection, setSelection] = useState<{ text: string; context: string } | null>(null);
  const [coords, setCoords] = useState<SelectionCoords | null>(null);
  const [justAdded, setJustAdded] = useState<PromotionType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addFinding, setStagingPanelOpen } = useStagingStore();
  const { currentCaseId } = useInvestigationStore();

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const text = sel.toString().trim();
    if (text.length < 3) {
      setSelection(null);
      setCoords(null);
      return;
    }

    // Get context — surrounding 80 chars
    const range = sel.getRangeAt(0);
    const container = range.startContainer;
    const fullText = container.textContent || "";
    const start = Math.max(0, (range.startOffset || 0) - 40);
    const end = Math.min(fullText.length, (range.endOffset || 0) + 40);
    const context = fullText.slice(start, end);

    // Position the tooltip near bottom of selection
    const rect = range.getBoundingClientRect();
    setCoords({
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY + 12,
    });
    setSelection({ text, context });
  }, []);

  const dismiss = useCallback(() => {
    setSelection(null);
    setCoords(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const promote = useCallback((type: PromotionType) => {
    if (!selection || !currentCaseId) return;

    addFinding({
      caseId: currentCaseId,
      type,
      text: selection.text,
      source,
      context: selection.context,
      suggestedName: selection.text.length < 50 ? selection.text : undefined,
    });

    setJustAdded(type);
    setTimeout(() => {
      setJustAdded(null);
      dismiss();
    }, 1200);
    
    setStagingPanelOpen(true);
  }, [selection, currentCaseId, addFinding, source, dismiss, setStagingPanelOpen]);

  // Close on outside click
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-promote-toolbar]")) return;
      dismiss();
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [dismiss]);

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseUp={handleMouseUp}
      style={{ userSelect: "text" }}
    >
      {children}

      <AnimatePresence>
        {selection && coords && (
          <motion.div
            data-promote-toolbar
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: coords.x,
              top: coords.y,
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
            className="flex items-center gap-1 bg-[#0d1424]/95 border border-[#1e3a5f]/60 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl p-1.5"
          >
            {justAdded ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-emerald-400"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                Sent to Staging Area
              </motion.div>
            ) : (
              <>
                <div className="px-2 py-1 text-[9px] text-slate-500 font-mono border-r border-slate-700/50 mr-1 max-w-[140px] truncate">
                  &ldquo;{selection.text}&rdquo;
                </div>
                <button
                  onClick={() => promote("entity")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-400 transition-all text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                >
                  <User size={11} />
                  Entity
                </button>
                <button
                  onClick={() => promote("event")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600 hover:text-white hover:border-amber-400 transition-all text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                >
                  <Calendar size={11} />
                  Event
                </button>
                <button
                  onClick={() => { addFinding({ caseId: currentCaseId!, type: "entity", text: selection.text, source, context: selection.context }); setStagingPanelOpen(true); dismiss(); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                >
                  <Inbox size={11} />
                  Stage
                </button>
                <button
                  onClick={dismiss}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all ml-0.5"
                >
                  <X size={12} />
                </button>
              </>
            )}

            {/* Arrow */}
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0d1424] border-l border-t border-[#1e3a5f]/60 rotate-45"
              style={{ zIndex: -1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
