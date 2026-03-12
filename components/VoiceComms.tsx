"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Signal,
  Volume2,
  ShieldCheck,
  Headphones,
  AlertCircle,
  Wifi,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceComms } from "@/hooks/useVoiceComms";
import { PeerAudioPlayer } from "./voice/PeerAudioPlayer";

interface VoiceCommsProps {
  caseId: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onActiveChange?: (active: boolean) => void;
}

export default function VoiceComms({ caseId, currentUser, onActiveChange }: VoiceCommsProps) {
    const {
        isActive,
        isMuted,
        error,
        peers,
        activeSpeakers,
        networkQuality,
        joinChannel,
        leaveChannel,
        toggleMute,
        sessionId,
        getAudioContext
    } = useVoiceComms(caseId, currentUser, onActiveChange);

    const [isSecure, setIsSecure] = useState(false);
    useEffect(() => setIsSecure(window.isSecureContext), []);

    const peerList = Object.entries(peers);
    const totalConnected = peerList.filter(([, p]) => p.state === "connected").length;

    const networkBadge = {
        unknown: { color: "amber", label: "PROBING ROUTE" },
        good: { color: "emerald", label: "DIRECT P2P" },
        relay: { color: "blue", label: "TURN RELAY" },
        poor: { color: "red", label: "POOR SIGNAL" },
    }[networkQuality];

    return (
        <div className="bg-[#0a0f1c]/40 border border-[#1e3a5f]/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,95,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,95,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                            isActive ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] ring-1 ring-blue-400/50" : "bg-white/5 border border-white/10"
                        )}
                    >
                        {isActive ? (
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                                <Headphones size={22} className="text-white" />
                            </motion.div>
                        ) : (
                            <Users size={22} className="text-slate-500" />
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">Comms Channel</h4>
                            <div
                                className={cn(
                                    "px-1.5 py-0.5 rounded flex items-center gap-1 border",
                                    isSecure ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
                                )}
                            >
                                <div className={cn("w-1 h-1 rounded-full", isSecure ? "bg-emerald-400" : "bg-amber-400")} />
                                <span className={cn("text-[7px] font-black uppercase tracking-tighter", isSecure ? "text-emerald-400" : "text-amber-400")}>
                                    {isSecure ? "Secure" : "Insecure"}
                                </span>
                            </div>
                            {isActive && (
                                <div
                                    className={cn(
                                        "px-1.5 py-0.5 rounded flex items-center gap-1 border",
                                        networkQuality === "good" ? "bg-emerald-500/10 border-emerald-500/20" : networkQuality === "relay" ? "bg-blue-500/10 border-blue-500/20" : "bg-amber-500/10 border-amber-500/20"
                                    )}
                                >
                                    {networkQuality === "good" ? <Wifi size={7} className="text-emerald-400" /> : <Signal size={7} className="text-amber-400" />}
                                    <span className={cn("text-[7px] font-black uppercase tracking-tighter", networkQuality === "good" ? "text-emerald-400" : networkQuality === "relay" ? "text-blue-400" : "text-amber-400")}>
                                        {networkBadge.label}
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5">
                            {isActive ? (
                                <>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3].map((i) => (
                                            <motion.div key={i} animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} className="w-0.5 bg-blue-500/60" />
                                        ))}
                                    </div>
                                    {totalConnected + 1} Operative{totalConnected + 1 !== 1 ? "s" : ""} Linked
                                </>
                            ) : "Encryption Layer Offline"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isActive ? (
                        <button
                            onClick={joinChannel}
                            disabled={!currentUser.id}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border active:scale-95",
                                !currentUser.id ? "bg-white/5 border-white/10 text-slate-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40 border-blue-400/30"
                            )}
                        >
                            {!currentUser.id ? "Identity Missing" : "Establish Link"}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 shadow-inner">
                            <button
                                onClick={toggleMute}
                                className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                    isMuted ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "hover:bg-white/10 text-slate-400 hover:text-white"
                                )}
                                title={isMuted ? "Unmute Mic" : "Mute Mic"}
                            >
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            
                            <button
                                onClick={() => {
                                    const audioTags = document.querySelectorAll('audio');
                                    audioTags.forEach(tag => tag.play().catch(()=>{}));
                                    getAudioContext().resume().catch(()=>{});
                                }}
                                className="w-10 h-10 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                                title="Force Audio Resume (Click if you can't hear)"
                            >
                                <RefreshCw size={18} className={isActive ? "animate-spin-slow" : ""} />
                            </button>

                            <div className="w-[1px] h-6 bg-white/10 mx-1" />

                            <button
                                onClick={leaveChannel}
                                className="w-10 h-10 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-red-600/20"
                                title="Disconnect"
                            >
                                <PhoneOff size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-500 shrink-0" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{error}</span>
                    </motion.div>
                )}

                {isActive && (
                    <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: "auto", opacity: 1, marginTop: 24 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="flex flex-wrap gap-4 overflow-hidden">
                        <div className="flex flex-col items-center gap-2">
                            <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center relative transition-all duration-300", activeSpeakers[`${currentUser.id}:${sessionId}`] ? "border-blue-500 ring-4 ring-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.3)] bg-blue-500/10" : "border-white/10 bg-white/5", isMuted && "opacity-40 grayscale")}>
                                <div className="text-[12px] font-black text-white uppercase">{currentUser.name.substring(0, 2)}</div>
                                {activeSpeakers[`${currentUser.id}:${sessionId}`] && !isMuted && (
                                    <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 bg-[#0d152a] rounded-md border border-blue-500/30">
                                        {[0, 100, 200].map((d) => <div key={d} className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                                    </div>
                                )}
                                {isMuted && <MicOff size={12} className="absolute -top-1 -right-1 text-red-500 bg-[#0d152a] rounded-full p-0.5 border border-red-500/30" />}
                            </div>
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">You</span>
                        </div>

                        {peerList.map(([peerKey, peer]) => (
                            <div key={peerKey} className="flex flex-col items-center gap-2">
                                <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center relative transition-all duration-300 shadow-lg", peer.state === "failed" ? "border-red-500/50 bg-red-500/5" : peer.state === "connecting" ? "border-amber-500/50 bg-amber-500/5" : activeSpeakers[peerKey] ? "border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/10" : "border-white/10 bg-white/5", peer.state === "connected" && "opacity-100")}>
                                    <div className="text-[12px] font-black text-white uppercase">{peer.userName.substring(0, 2)}</div>
                                    <PeerAudioPlayer stream={peer.stream} peerKey={peerKey} />
                                    {peer.state === "connecting" && (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="absolute -top-1 -right-1 bg-[#0d152a] rounded-full p-0.5 border border-amber-500/30">
                                            <RefreshCw size={8} className="text-amber-400" />
                                        </motion.div>
                                    )}
                                    {peer.state === "connected" && activeSpeakers[peerKey] && (
                                        <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 bg-[#0d152a] rounded-md border border-emerald-500/30">
                                            {[0, 100, 200].map((d) => <div key={d} className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] max-w-[56px] truncate text-center">{peer.userName}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">DTLS-SRTP Encrypted</span>
                    </div>
                    <div className="w-[1px] h-3 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <Signal size={12} className="text-blue-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">STUN + TURN Mesh</span>
                    </div>
                </div>
                {isActive && (
                    <div className="flex items-center gap-2">
                        <Volume2 size={10} className="text-blue-500/60" />
                        <span className="text-[8px] font-bold text-slate-600 uppercase tabular-nums">CROSS_NET_READY</span>
                    </div>
                )}
            </div>
        </div>
    );
}
