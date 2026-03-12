"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";
import VoiceComms from "../VoiceComms";

interface VoiceCommsOverlayProps {
    fullUser: any;
    currentCaseId: string | null;
    voiceOpen: boolean;
    setVoiceActive: (val: boolean) => void;
}

export default function VoiceCommsOverlay({
    fullUser,
    currentCaseId,
    voiceOpen,
    setVoiceActive
}: VoiceCommsOverlayProps) {
    if (!fullUser) return null;

    return (
        <>
            {/* ── Voice Comms floating panel ──────────────────────────────────────
                 IMPORTANT: VoiceComms is ALWAYS mounted — never conditionally rendered.
                 Closing the panel only hides it visually (CSS/animation). This ensures
                 the WebRTC connection and audio streams persist when the user closes
                 the panel. Only the user clicking "End Call" stops the connection.
            ────────────────────────────────────────────────────── */}
            {currentCaseId && (
                <motion.div
                    animate={{
                        opacity: voiceOpen ? 1 : 0,
                        y: voiceOpen ? 0 : -10,
                        scale: voiceOpen ? 1 : 0.97,
                        pointerEvents: voiceOpen ? "auto" : "none",
                    }}
                    initial={false}
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    className="fixed top-[56px] right-[260px] z-[80] w-[480px] max-w-[calc(100vw-2rem)]"
                >
                    {/* Arrow notch */}
                    <div className="absolute -top-1.5 right-[68px] w-3 h-3 bg-[#0d1424] border-l border-t border-[#1e3a5f]/50 rotate-45" />
                    <div className="mt-1 rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)] border border-[#1e3a5f]/40">
                        <VoiceComms
                            caseId={currentCaseId}
                            currentUser={{
                                id: fullUser.id,
                                name: fullUser.name,
                                avatar: fullUser.avatar,
                            }}
                            onActiveChange={setVoiceActive}
                        />
                    </div>
                </motion.div>
            )}

            {/* No-case placeholder — only shown when panel open but no case selected */}
            <AnimatePresence>
                {!currentCaseId && voiceOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="fixed top-[56px] right-[260px] z-[80] w-[480px] max-w-[calc(100vw-2rem)]"
                    >
                        <div className="mt-1 rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)] border border-[#1e3a5f]/40 bg-[#0d1424]/95 backdrop-blur-xl p-8 flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Radio size={22} className="text-emerald-500" />
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Case Active</p>
                            <p className="text-[10px] text-slate-600 max-w-[240px]">Open a case to enable tactical voice communications.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
