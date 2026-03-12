"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceCommsProps {
  caseId: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onActiveChange?: (active: boolean) => void;
}

interface PeerConnection {
  connection: RTCPeerConnection;
  stream: MediaStream;
  userName: string;
  sessionId: string;
  state: "connecting" | "connected" | "failed";
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun.relay.metered.ca:80" },
  {
    urls: "turn:standard.relay.metered.ca:80",
    username: "e2a44b0e2a6e8dd4e30a5bbd",
    credential: "yFvlO9N6z1w5BXJH",
  },
  {
    urls: "turn:standard.relay.metered.ca:443",
    username: "e2a44b0e2a6e8dd4e30a5bbd",
    credential: "yFvlO9N6z1w5BXJH",
  },
  {
    urls: "turn:standard.relay.metered.ca:443?transport=tcp",
    username: "e2a44b0e2a6e8dd4e30a5bbd",
    credential: "yFvlO9N6z1w5BXJH",
  },
  {
  urls: "turn:openrelay.metered.ca:443?transport=tcp",
  username: "openrelayproject",
  credential: "openrelayproject",
},
];

// Completely isolated audio playback component to guarantee it renders, attaches, and plays.
function PeerAudioPlayer({
  stream,
  peerKey,
}: {
  stream: MediaStream;
  peerKey: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.srcObject !== stream) {
      audio.srcObject = stream;
    }

    const playAudio = async () => {
      try {
        await audio.play();
      } catch (err) {
        console.warn(`[${peerKey}] autoplay blocked`);
      }
    };

    playAudio();

    const resume = () => playAudio();
    document.addEventListener("click", resume);

    return () => {
      document.removeEventListener("click", resume);
    };
  }, [stream, peerKey]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      muted={false}
      className="absolute opacity-0 w-px h-px pointer-events-none"
    />
  );
}

export default function VoiceComms({ caseId, currentUser, onActiveChange }: VoiceCommsProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSecure, setIsSecure] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerConnection>>({});
  const [activeSpeakers, setActiveSpeakers] = useState<Record<string, boolean>>({});
  const [networkQuality, setNetworkQuality] = useState<"unknown" | "good" | "relay" | "poor">("unknown");

  const isActiveRef = useRef(false);
  const sessionId = useRef(`${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`).current;
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const channelRef = useRef<any>(null);

  const pendingCandidates = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const makingOfferRef = useRef<Record<string, boolean>>({});
  const ignoreOfferRef = useRef<Record<string, boolean>>({});

  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Record<string, AnalyserNode>>({});
  const animFrames = useRef<Record<string, number>>({});

  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  // Use AudioContext purely for metering active speakers (NO stream modification)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          latencyHint: "interactive",
          sampleRate: 48000,
      });
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const setupMetering = useCallback((key: string, stream: MediaStream) => {
    try {
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser); // Connect to analyser ONLY. No destination connection.
      analysersRef.current[key] = analyser;

      const check = () => {
        if (!analysersRef.current[key] || !isActiveRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setActiveSpeakers((prev) => ({ ...prev, [key]: avg > 15 }));
        animFrames.current[key] = requestAnimationFrame(check);
      };
      check();
    } catch (e) {
      console.warn("Audio meter setup failed:", e);
    }
  }, [getAudioContext]);

 const flushPendingCandidates = async (peerKey: string) => {
  const pc = peerConnections.current[peerKey];
  const candidates = pendingCandidates.current[peerKey];

  if (!pc || !pc.remoteDescription || !candidates) return;

  for (const c of candidates) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    } catch {}
  }

  pendingCandidates.current[peerKey] = [];
};

  const cleanupPeer = useCallback((peerKey: string) => {
    if (animFrames.current[peerKey]) {
      cancelAnimationFrame(animFrames.current[peerKey]);
      delete animFrames.current[peerKey];
    }
    if (analysersRef.current[peerKey]) {
      delete analysersRef.current[peerKey];
    }
    if (peerConnections.current[peerKey]) {
      peerConnections.current[peerKey].ontrack = null;
      peerConnections.current[peerKey].onicecandidate = null;
      peerConnections.current[peerKey].onconnectionstatechange = null;
      peerConnections.current[peerKey].close();
      delete peerConnections.current[peerKey];
    }
    delete pendingCandidates.current[peerKey];
    setPeers((prev) => {
      const n = { ...prev };
      delete n[peerKey];
      return n;
    });
    setActiveSpeakers((prev) => {
      const n = { ...prev };
      delete n[peerKey];
      return n;
    });
  }, []);

  const getOrCreatePeerConnection = useCallback((targetUserId: string, targetSessionId: string, userName: string) => {
      const peerKey = `${targetUserId}:${targetSessionId}`;
      if (peerConnections.current[peerKey]) {
        return peerConnections.current[peerKey];
      }

      console.log(`[${peerKey}] Creating new connection to ${userName}`);
      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceTransportPolicy: "all",
      });
      peerConnections.current[peerKey] = pc;
      pendingCandidates.current[peerKey] = [];
      makingOfferRef.current[peerKey] = false;
      ignoreOfferRef.current[peerKey] = false;

      // Add local tracks
const stream = localStreamRef.current;

if (stream) {
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream);
  }
}
      pc.onicecandidate = ({ candidate }) => {
        if (candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: {
              candidate: candidate.toJSON(),
              from: currentUser.id,
              fromSession: sessionId,
              toUser: targetUserId,
              toSession: targetSessionId,
            },
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          pc.getStats().then((stats) => {
            stats.forEach((report) => {
              if (report.type === "candidate-pair" && report.state === "succeeded") {
                const localCandType = report.localCandidateId;
                setNetworkQuality(localCandType?.includes("relay") ? "relay" : "good");
              }
            });
          }).catch(() => setNetworkQuality("good"));
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`[${peerKey}] Connection state: ${state}`);
        setPeers((prev) => {
          if (!prev[peerKey]) return prev;
          return {
            ...prev,
            [peerKey]: {
              ...prev[peerKey],
              state: state === "connected" ? "connected" : state === "failed" || state === "disconnected" ? "failed" : "connecting",
            },
          };
        });

        if (state === "failed") {
          if (makingOfferRef.current[peerKey] === false) {
            makingOfferRef.current[peerKey] = true;
            pc.restartIce();
            pc.createOffer({ iceRestart: true })
              .then((offer) => pc.setLocalDescription(offer))
              .then(() => {
                channelRef.current?.send({
                  type: "broadcast",
                  event: "voice-offer",
                  payload: {
                    offer: pc.localDescription!.toJSON(),
                    from: currentUser.id,
                    fromSession: sessionId,
                    fromName: currentUser.name,
                    toUser: targetUserId,
                    toSession: targetSessionId,
                    isRestart: true,
                  },
                });
              })
              .catch(() => cleanupPeer(peerKey))
              .finally(() => makingOfferRef.current[peerKey] = false);
          }
        }
        if (state === "closed") cleanupPeer(peerKey);
      };

      pc.onnegotiationneeded = async () => {
        if (!isActiveRef.current) return;
        try {
          makingOfferRef.current[peerKey] = true;
          const offer = await pc.createOffer();
          if (pc.signalingState !== "stable") return;
          await pc.setLocalDescription(offer);
          channelRef.current?.send({
            type: "broadcast",
            event: "voice-offer",
            payload: {
              offer: pc.localDescription!.toJSON(),
              from: currentUser.id,
              fromSession: sessionId,
              fromName: currentUser.name,
              toUser: targetUserId,
              toSession: targetSessionId,
            },
          });
        } catch (e) {
        } finally {
          makingOfferRef.current[peerKey] = false;
        }
      };

pc.ontrack = (event) => {
  const stream = event.streams[0];
  if (!stream) return;

  console.log(`[${peerKey}] Track received`);

  setPeers((prev) => ({
    ...prev,
    [peerKey]: {
      connection: pc,
      stream,
      userName,
      sessionId: targetSessionId,
      state: "connected",
    },
  }));

  setupMetering(peerKey, stream);
};
      return pc;
    },
    [currentUser.id, currentUser.name, sessionId, setupMetering, cleanupPeer, flushPendingCandidates, getAudioContext]
  );

  const initiateOffer = useCallback(async (targetUserId: string, targetSessionId: string, userName: string) => {
      const peerKey = `${targetUserId}:${targetSessionId}`;
      if (makingOfferRef.current[peerKey]) return;
      const pc = getOrCreatePeerConnection(targetUserId, targetSessionId, userName);
      try {
        makingOfferRef.current[peerKey] = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channelRef.current?.send({
          type: "broadcast",
          event: "voice-offer",
          payload: {
            offer: pc.localDescription!.toJSON(),
            from: currentUser.id,
            fromSession: sessionId,
            fromName: currentUser.name,
            toUser: targetUserId,
            toSession: targetSessionId,
          },
        });
      } catch (e) {
      } finally {
        makingOfferRef.current[peerKey] = false;
      }
    },
    [getOrCreatePeerConnection, currentUser.id, currentUser.name, sessionId]
  );

  useEffect(() => {
    if (!caseId) return;
    const channel = supabase.channel(`voice-${caseId}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: sessionId } },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "voice-join" }, async ({ payload }: any) => {
      if (payload.sessionId === sessionId) return;
      if (isActiveRef.current) {
        channel.send({
          type: "broadcast",
          event: "voice-announce",
          payload: { userId: currentUser.id, userName: currentUser.name, sessionId },
        });
        if (sessionId < payload.sessionId) {
          await initiateOffer(payload.userId, payload.sessionId, payload.userName);
        }
      }
    });

    channel.on("broadcast", { event: "voice-announce" }, async ({ payload }: any) => {
      if (payload.sessionId === sessionId) return;
      if (isActiveRef.current && sessionId < payload.sessionId) {
        await initiateOffer(payload.userId, payload.sessionId, payload.userName);
      }
    });

    channel.on("broadcast", { event: "voice-offer" }, async ({ payload }: any) => {
      if (payload.toUser !== currentUser.id || payload.toSession !== sessionId) return;
      const peerKey = `${payload.from}:${payload.fromSession}`;
      const polite = sessionId > payload.fromSession;
      const pc = getOrCreatePeerConnection(payload.from, payload.fromSession, payload.fromName);
      
      const offerCollision = makingOfferRef.current[peerKey] || pc.signalingState !== "stable";
      ignoreOfferRef.current[peerKey] = !polite && offerCollision;
      if (ignoreOfferRef.current[peerKey]) return;
      
      if (offerCollision && polite) {
        await pc.setLocalDescription({ type: "rollback" }).catch(() => {});
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        await flushPendingCandidates(peerKey);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({
          type: "broadcast",
          event: "voice-answer",
          payload: {
            answer: pc.localDescription!.toJSON(),
            from: currentUser.id,
            fromSession: sessionId,
            toUser: payload.from,
            toSession: payload.fromSession,
          },
        });
      } catch (e) {}
    });

    channel.on("broadcast", { event: "voice-answer" }, async ({ payload }: any) => {
      if (payload.toUser !== currentUser.id || payload.toSession !== sessionId) return;
      const peerKey = `${payload.from}:${payload.fromSession}`;
      const pc = peerConnections.current[peerKey];
      if (!pc || pc.signalingState !== "have-local-offer") return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        await flushPendingCandidates(peerKey);
      } catch (e) {}
    });

    channel.on("broadcast", { event: "ice-candidate" }, async ({ payload }: any) => {
      if (payload.toUser !== currentUser.id || payload.toSession !== sessionId) return;
      const peerKey = `${payload.from}:${payload.fromSession}`;
      const pc = peerConnections.current[peerKey];

      if (!pc || !pc.remoteDescription) {
        if (!pendingCandidates.current[peerKey]) pendingCandidates.current[peerKey] = [];
        pendingCandidates.current[peerKey].push(payload.candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) { }
    });

    channel.on("broadcast", { event: "voice-leave" }, ({ payload }: any) => {
      cleanupPeer(`${payload.userId}:${payload.sessionId}`);
    });

    channel.subscribe();
    return () => {
      leaveChannel();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const joinChannel = async () => {
    try {
      setError(null);
      setNetworkQuality("unknown");
      if (!currentUser.id) throw new Error("Identity missing");
      if (!channelRef.current) throw new Error("Comms channel not ready");

      // Simplified straight-forward media request!
    const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: false,
});

await getAudioContext().resume(); // ⭐ ADD THIS

localStreamRef.current = stream;

      localStreamRef.current = stream;
      setIsActive(true);
      isActiveRef.current = true;

      // Make sure we meter our own voice for the active ring UI!
      setupMetering(`${currentUser.id}:${sessionId}`, stream);

      channelRef.current.send({
        type: "broadcast",
        event: "voice-join",
        payload: { userId: currentUser.id, userName: currentUser.name, sessionId },
      });
    } catch (err: any) {
      setError(err.message || "Failed to start microphone");
      setIsActive(false);
      isActiveRef.current = false;
    }
  };

  const leaveChannel = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    setNetworkQuality("unknown");
    setActiveSpeakers({});

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    Object.keys(animFrames.current ?? {}).forEach((k) => cancelAnimationFrame(animFrames.current![k]));
    animFrames.current = {};

    Object.keys(peerConnections.current).forEach(cleanupPeer);

    channelRef.current?.send({
      type: "broadcast",
      event: "voice-leave",
      payload: { userId: currentUser.id, sessionId },
    });

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, [cleanupPeer, currentUser.id, sessionId]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  };

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
                  {networkQuality === "good" ? <Wifi size={7} className="text-emerald-400" /> : networkQuality === "relay" ? <RefreshCw size={7} className="text-blue-400" /> : <Signal size={7} className="text-amber-400" />}
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
                <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center relative transition-all duration-300 shadow-lg", peer.state === "failed" ? "border-red-500/50 bg-red-500/5" : peer.state === "connecting" ? "border-amber-500/50 bg-amber-500/5" : activeSpeakers[peerKey] ? "border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/10" : "border-white/10 bg-white/5")}>
                  <div className="text-[12px] font-black text-white uppercase">{peer.userName.substring(0, 2)}</div>
                  
                  {/* Robust Isolated Audio Component! */}
                  <PeerAudioPlayer stream={peer.stream} peerKey={peerKey} />

                  {peer.state === "connecting" && (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="absolute -top-1 -right-1 bg-[#0d152a] rounded-full p-0.5 border border-amber-500/30">
                      <RefreshCw size={8} className="text-amber-400" />
                    </motion.div>
                  )}
                  {peer.state === "failed" && <WifiOff size={10} className="absolute -top-1 -right-1 text-red-500 bg-[#0d152a] rounded-full p-0.5 border border-red-500/30" />}
                  {peer.state === "connected" && activeSpeakers[peerKey] && (
                    <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 bg-[#0d152a] rounded-md border border-emerald-500/30">
                      {[0, 100, 200].map((d) => <div key={d} className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] max-w-[56px] truncate text-center">{peer.userName}</span>
              </div>
            ))}

            {peerList.length === 0 && (
              <div className="flex-1 h-14 flex items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em] animate-pulse">Awaiting peers on any network…</span>
              </div>
            )}
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
