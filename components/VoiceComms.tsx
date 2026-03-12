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
  /** Called whenever the call goes active/inactive — lets the parent show a live indicator */
  onActiveChange?: (active: boolean) => void;
}

interface PeerConnection {
  connection: RTCPeerConnection;
  stream: MediaStream;
  userName: string;
  sessionId: string;
  state: "connecting" | "connected" | "failed";
}

// ─── ICE Server Config ────────────────────────────────────────────────────────
// Using multiple TURN providers for maximum cross-network compatibility.
// Metered Open Relay: free, no signup, 20GB/mo, runs on ports 80/443 (firewall bypass)
// These are real, working public TURN credentials from the Open Relay project.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.relay.metered.ca:80" },
  // Metered TURN servers (Primary)
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
  // Numb TURN servers (Backup)
  {
    urls: "turn:numb.viagenie.ca",
    username: "itouch@itouch.io",
    credential: "itouchpassword",
  }
];

export default function VoiceComms({ caseId, currentUser, onActiveChange }: VoiceCommsProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSecure, setIsSecure] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerConnection>>({});
  const [activeSpeakers, setActiveSpeakers] = useState<Record<string, boolean>>({});
  const [networkQuality, setNetworkQuality] = useState<"unknown" | "good" | "relay" | "poor">("unknown");

  const isActiveRef = useRef(false);
  const sessionId = useRef(
    `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
  ).current;
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const channelRef = useRef<any>(null);

  // ICE candidate queue — stores candidates received before remoteDescription is set
  const pendingCandidates = useRef<Record<string, RTCIceCandidateInit[]>>({});
  // Track makingOffer state to handle offer collisions
  const makingOfferRef = useRef<Record<string, boolean>>({});
  const ignoreOfferRef = useRef<Record<string, boolean>>({});

  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Record<string, AnalyserNode>>({});
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const audioDestNodesRef = useRef<Record<string, MediaStreamAudioDestinationNode>>({});
  const animFrames = useRef<Record<string, number>>();
  if (!animFrames.current) animFrames.current = {};

  // Lifecycle monitoring for parent components
  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  // Processed (boosted + EQ'd) streams for each peer — used by <audio> elements
  const [processedStreams, setProcessedStreams] = useState<Record<string, MediaStream>>({});

  // ─── Ensure AudioContext is ready ────────────────────────────────────────
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
          latencyHint: "interactive",
          sampleRate: 48000,
        });
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // ─── Local mic analysis (no boost — just metering) ────────────────────────
  const setupLocalAudioAnalysis = useCallback((key: string, stream: MediaStream) => {
    try {
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      // NOTE: do NOT connect to ctx.destination — would cause mic loopback/echo
      analysersRef.current[key] = analyser;

      const check = () => {
        if (!analysersRef.current[key] || !isActiveRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setActiveSpeakers((prev) => ({ ...prev, [key]: avg > 15 }));
        animFrames.current![key] = requestAnimationFrame(check);
      };
      check();
    } catch (e) {
      console.warn("Local audio analysis failed:", e);
    }
  }, [getAudioContext]);

  // ─── Remote audio: boost + compress + EQ, output via <audio> element ──────────────
  //
  // WHY MediaStreamAudioDestinationNode instead of ctx.destination:
  // ctx.destination is unreliable for playback across browsers (can be suspended,
  // silenced by browser autoplay policy, or just not map to speakers in all contexts).
  // The ONLY guaranteed way to play audio is via an HTML <audio autoPlay> element.
  // So: remote stream → Web Audio processing chain → MediaStreamDestination → <audio>.
  const setupRemoteAudioProcessing = useCallback((key: string, stream: MediaStream) => {
    try {
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);

      // 1. High-pass filter — cut rumble / noise below 80Hz
      const highPass = ctx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.setValueAtTime(80, ctx.currentTime);
      highPass.Q.setValueAtTime(0.7, ctx.currentTime);

      // 2. Presence EQ — +4dB at 3kHz (human voice clarity band)
      const presenceEQ = ctx.createBiquadFilter();
      presenceEQ.type = "peaking";
      presenceEQ.frequency.setValueAtTime(3000, ctx.currentTime);
      presenceEQ.gain.setValueAtTime(4, ctx.currentTime);
      presenceEQ.Q.setValueAtTime(1, ctx.currentTime);

      // 3. Gain — 2× amplification
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(2.0, ctx.currentTime);
      gainNodesRef.current[key] = gain;

      // 4. Dynamics compressor — normalize levels, prevent distortion
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(12, ctx.currentTime);
      compressor.ratio.setValueAtTime(4, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.15, ctx.currentTime);

      // 5. Analyser — for the speaking indicator
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analysersRef.current[key] = analyser;

      // 6. MediaStreamDestination — the processed audio comes out as a MediaStream
      //    that an <audio autoPlay> element can reliably play
      const destination = ctx.createMediaStreamDestination();
      audioDestNodesRef.current[key] = destination;

      // Chain: source → highPass → presenceEQ → gain → compressor → destination (MediaStream)
      //                                                    └→ analyser (metering only)
      source.connect(highPass);
      highPass.connect(presenceEQ);
      presenceEQ.connect(gain);
      gain.connect(compressor);
      gain.connect(analyser);
      compressor.connect(destination);

      // Expose the processed MediaStream so the <audio> element can play it
      setProcessedStreams((prev) => ({ ...prev, [key]: destination.stream }));

      const check = () => {
        if (!analysersRef.current[key] || !isActiveRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setActiveSpeakers((prev) => ({ ...prev, [key]: avg > 15 }));
        animFrames.current![key] = requestAnimationFrame(check);
      };
      check();
    } catch (e) {
      console.warn("Remote audio processing failed:", e);
    }
  }, [getAudioContext]);

  // ─── Flush Pending ICE Candidates ────────────────────────────────────────
  const flushPendingCandidates = useCallback(async (peerKey: string) => {
    const pc = peerConnections.current[peerKey];
    const candidates = pendingCandidates.current[peerKey] || [];
    if (!pc || !pc.remoteDescription || candidates.length === 0) return;
    console.log(`📨 Flushing ${candidates.length} queued ICE candidates for ${peerKey}`);
    for (const c of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn("ICE flush error:", e);
      }
    }
    pendingCandidates.current[peerKey] = [];
  }, []);

  // ─── Peer Cleanup ─────────────────────────────────────────────────────────
  const cleanupPeer = useCallback((peerKey: string) => {
    console.log(`🧹 Cleaning up peer: ${peerKey}`);
    if (animFrames.current?.[peerKey]) {
      cancelAnimationFrame(animFrames.current[peerKey]);
      delete animFrames.current[peerKey];
    }
    if (analysersRef.current[peerKey]) {
      delete analysersRef.current[peerKey];
    }
    if (gainNodesRef.current[peerKey]) {
      try { gainNodesRef.current[peerKey].disconnect(); } catch {}
      delete gainNodesRef.current[peerKey];
    }
    if (audioDestNodesRef.current[peerKey]) {
      try { audioDestNodesRef.current[peerKey].disconnect(); } catch {}
      delete audioDestNodesRef.current[peerKey];
    }
    if (peerConnections.current[peerKey]) {
      peerConnections.current[peerKey].ontrack = null;
      peerConnections.current[peerKey].onicecandidate = null;
      peerConnections.current[peerKey].onconnectionstatechange = null;
      peerConnections.current[peerKey].close();
      delete peerConnections.current[peerKey];
    }
    delete pendingCandidates.current[peerKey];
    delete makingOfferRef.current[peerKey];
    delete ignoreOfferRef.current[peerKey];
    setPeers((prev) => {
      const n = { ...prev };
      delete n[peerKey];
      return n;
    });
    setProcessedStreams((prev) => {
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

  // ─── Create / Get Peer Connection ─────────────────────────────────────────
  const getOrCreatePeerConnection = useCallback(
    (targetUserId: string, targetSessionId: string, userName: string) => {
      const peerKey = `${targetUserId}:${targetSessionId}`;
      if (peerConnections.current[peerKey]) {
        return peerConnections.current[peerKey];
      }

      console.log(`🏗️ New RTCPeerConnection for ${userName} [${peerKey}]`);
      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        // Prefer relay to ensure cross-network works; direct also tried first
        iceTransportPolicy: "all",
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });
      peerConnections.current[peerKey] = pc;
      pendingCandidates.current[peerKey] = [];
      makingOfferRef.current[peerKey] = false;
      ignoreOfferRef.current[peerKey] = false;

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // ICE candidate handler
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

      // Track ICE candidate type for network quality indicator
      pc.oniceconnectionstatechange = () => {
        console.log(`🧊 ICE [${userName}]: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          // Check what type of candidate pair was used
          pc.getStats().then((stats) => {
            stats.forEach((report) => {
              if (report.type === "candidate-pair" && report.state === "succeeded") {
                const localCandType = report.localCandidateId;
                if (localCandType?.includes("relay")) {
                  setNetworkQuality("relay");
                } else {
                  setNetworkQuality("good");
                }
              }
            });
          }).catch(() => setNetworkQuality("good"));
        }
      };

      // Connection state monitoring + auto-recovery
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`📶 Conn [${userName}]: ${state}`);

        setPeers((prev) => {
          if (!prev[peerKey]) return prev;
          return {
            ...prev,
            [peerKey]: {
              ...prev[peerKey],
              state:
                state === "connected"
                  ? "connected"
                  : state === "failed" || state === "disconnected"
                  ? "failed"
                  : "connecting",
            },
          };
        });

        if (state === "failed") {
          console.warn(`⚠️ Connection failed for ${userName}. Will attempt ICE restart.`);
          // ICE restart — re-negotiate without destroying the peer
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
                makingOfferRef.current[peerKey] = false;
              })
              .catch((e) => {
                console.error("ICE restart failed:", e);
                cleanupPeer(peerKey);
                makingOfferRef.current[peerKey] = false;
              });
          }
        }

        if (state === "closed") {
          cleanupPeer(peerKey);
        }
      };

      // Negotiation needed (for restarts)
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
          console.error("onnegotiationneeded error:", e);
        } finally {
          makingOfferRef.current[peerKey] = false;
        }
      };

      // Remote track received — run through Web Audio boost+clarity chain
      pc.ontrack = ({ streams }) => {
        if (!streams[0]) return;
        console.log(`🔊 Remote audio from ${userName} — applying boost & EQ`);
        setPeers((prev) => ({
          ...prev,
          [peerKey]: {
            connection: pc,
            stream: streams[0],
            userName,
            sessionId: targetSessionId,
            state: "connected",
          },
        }));
        // Run through gain + compressor + EQ chain (routes to speakers internally)
        // Force resume AudioContext on incoming tracks to wake up backgrounded contexts
        const ctx = getAudioContext();
        if (ctx.state === "suspended") ctx.resume();
        
        setupRemoteAudioProcessing(peerKey, streams[0]);
      };

      return pc;
    },
    [currentUser.id, currentUser.name, sessionId, setupRemoteAudioProcessing, cleanupPeer, flushPendingCandidates]
  );

  // ─── Initiate Offer ───────────────────────────────────────────────────────
  const initiateOffer = useCallback(
    async (targetUserId: string, targetSessionId: string, userName: string) => {
      const peerKey = `${targetUserId}:${targetSessionId}`;
      if (makingOfferRef.current[peerKey]) return;
      const pc = getOrCreatePeerConnection(targetUserId, targetSessionId, userName);
      try {
        makingOfferRef.current[peerKey] = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log(`📤 Sending offer to ${userName}`);
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
        console.error("Offer error:", e);
      } finally {
        makingOfferRef.current[peerKey] = false;
      }
    },
    [getOrCreatePeerConnection, currentUser.id, currentUser.name, sessionId]
  );

  // ─── Supabase Channel Setup ───────────────────────────────────────────────
  useEffect(() => {
    if (!caseId) return;
    console.log(`📡 Opening Comms Channel [voice-${caseId}]`);

    const channel = supabase.channel(`voice-${caseId}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: sessionId },
      },
    });
    channelRef.current = channel;

    // ── Peer discovery (Join & Announce) ──
    channel.on("broadcast", { event: "voice-join" }, async ({ payload }: any) => {
      if (payload.sessionId === sessionId) return;
      console.log(`👤 New peer arrived: ${payload.userName} [${payload.sessionId}]`);
      if (isActiveRef.current) {
        // Send our own Presence info back so they know we are here
        channel.send({
          type: "broadcast",
          event: "voice-announce",
          payload: {
            userId: currentUser.id,
            userName: currentUser.name,
            sessionId,
          },
        });
        
        // Peer with lexicographically SMALLER sessionId initiates
        if (sessionId < payload.sessionId) {
          await initiateOffer(payload.userId, payload.sessionId, payload.userName);
        }
      }
    });

    channel.on("broadcast", { event: "voice-announce" }, async ({ payload }: any) => {
      if (payload.sessionId === sessionId) return;
      console.log(`🏢 Existing peer found: ${payload.userName} [${payload.sessionId}]`);
      if (isActiveRef.current) {
        if (sessionId < payload.sessionId) {
          await initiateOffer(payload.userId, payload.sessionId, payload.userName);
        }
      }
    });

    // ── Offer received ──
    channel.on("broadcast", { event: "voice-offer" }, async ({ payload }: any) => {
      if (payload.toUser !== currentUser.id || payload.toSession !== sessionId) return;
      const peerKey = `${payload.from}:${payload.fromSession}`;
      console.log(`📥 Offer from ${payload.fromName} [restart=${!!payload.isRestart}]`);

      const polite = sessionId > payload.fromSession; // polite peer = larger sessionId
      const pc = getOrCreatePeerConnection(payload.from, payload.fromSession, payload.fromName);

      const offerCollision =
        makingOfferRef.current[peerKey] || pc.signalingState !== "stable";

      ignoreOfferRef.current[peerKey] = !polite && offerCollision;
      if (ignoreOfferRef.current[peerKey]) {
        console.warn(`⚡ Offer collision ignored (impolite peer) for ${payload.fromName}`);
        return;
      }
      if (offerCollision && polite) {
        await Promise.all([
          pc.setLocalDescription({ type: "rollback" }).catch(() => {}),
        ]);
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        await flushPendingCandidates(peerKey);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`📤 Sending answer to ${payload.fromName}`);
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
      } catch (e) {
        console.error("Answer error:", e);
      }
    });

    // ── Answer received ──
    channel.on("broadcast", { event: "voice-answer" }, async ({ payload }: any) => {
      if (payload.toUser !== currentUser.id || payload.toSession !== sessionId) return;
      const peerKey = `${payload.from}:${payload.fromSession}`;
      const pc = peerConnections.current[peerKey];
      if (!pc) return;
      if (pc.signalingState === "have-local-offer") {
        console.log(`📥 Answer from ${payload.from}. Setting remote desc.`);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          await flushPendingCandidates(peerKey);
        } catch (e) {
          console.error("setRemoteDescription (answer) error:", e);
        }
      }
    });

    // ── ICE Candidate received ──
    channel.on("broadcast", { event: "ice-candidate" }, async ({ payload }: any) => {
      if (payload.toUser !== currentUser.id || payload.toSession !== sessionId) return;
      const peerKey = `${payload.from}:${payload.fromSession}`;
      const pc = peerConnections.current[peerKey];

      if (!pc || !pc.remoteDescription) {
        // Queue it — remoteDescription not set yet
        if (!pendingCandidates.current[peerKey]) {
          pendingCandidates.current[peerKey] = [];
        }
        pendingCandidates.current[peerKey].push(payload.candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        if (!ignoreOfferRef.current[peerKey]) {
          console.warn("addIceCandidate error:", e);
        }
      }
    });

    // ── Peer leaves ──
    channel.on("broadcast", { event: "voice-leave" }, ({ payload }: any) => {
      const peerKey = `${payload.userId}:${payload.sessionId}`;
      console.log(`👋 Peer left: ${peerKey}`);
      cleanupPeer(peerKey);
    });

    channel.subscribe((status: string) => {
      console.log(`📶 Channel: ${status}`);
    });

    return () => {
      leaveChannel();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // ─── Join Channel ─────────────────────────────────────────────────────────
  const joinChannel = async () => {
    try {
      setError(null);
      setNetworkQuality("unknown");
      if (!currentUser.id) throw new Error("Identity missing — please log in");
      if (!channelRef.current) throw new Error("Comms channel not ready");

      console.log("🎤 Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      });

      console.log("✅ Mic granted");
      localStreamRef.current = stream;
      setIsActive(true);
      isActiveRef.current = true;

      setupLocalAudioAnalysis(`${currentUser.id}:${sessionId}`, stream);

      // Announce presence — everyone already in the room will hear this and respond
      console.log("📣 Broadcasting join...");
      channelRef.current.send({
        type: "broadcast",
        event: "voice-join",
        payload: {
          userId: currentUser.id,
          userName: currentUser.name,
          sessionId,
        },
      });
    } catch (err: any) {
      console.error("Join error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Mic permission denied — please allow microphone access"
          : err.name === "NotFoundError"
          ? "No microphone found"
          : err.message
      );
      setIsActive(false);
      isActiveRef.current = false;
    }
  };

  // ─── Leave Channel ────────────────────────────────────────────────────────
  const leaveChannel = useCallback(() => {
    console.log("🛑 Leaving channel...");
    isActiveRef.current = false;
    setIsActive(false);
    setNetworkQuality("unknown");
    setActiveSpeakers({});

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    Object.keys(animFrames.current ?? {}).forEach((k) => cancelAnimationFrame(animFrames.current![k]));
    if (animFrames.current) animFrames.current = {};

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

  useEffect(() => {
    setIsSecure(window.isSecureContext);
  }, []);

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
      {/* Grid BG */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,95,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,95,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between relative z-10">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
              isActive
                ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] ring-1 ring-blue-400/50"
                : "bg-white/5 border border-white/10"
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
              <h4 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">
                Comms Channel
              </h4>
              {/* Security Badge */}
              <div
                className={cn(
                  "px-1.5 py-0.5 rounded flex items-center gap-1 border",
                  isSecure
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                )}
              >
                <div className={cn("w-1 h-1 rounded-full", isSecure ? "bg-emerald-400" : "bg-amber-400")} />
                <span
                  className={cn(
                    "text-[7px] font-black uppercase tracking-tighter",
                    isSecure ? "text-emerald-400" : "text-amber-400"
                  )}
                >
                  {isSecure ? "Secure" : "Insecure"}
                </span>
              </div>
              {/* Network Quality Badge */}
              {isActive && (
                <div
                  className={cn(
                    "px-1.5 py-0.5 rounded flex items-center gap-1 border",
                    networkQuality === "good"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : networkQuality === "relay"
                      ? "bg-blue-500/10 border-blue-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}
                >
                  {networkQuality === "good" ? (
                    <Wifi size={7} className="text-emerald-400" />
                  ) : networkQuality === "relay" ? (
                    <RefreshCw size={7} className="text-blue-400" />
                  ) : (
                    <Signal size={7} className="text-amber-400" />
                  )}
                  <span
                    className={cn(
                      "text-[7px] font-black uppercase tracking-tighter",
                      networkQuality === "good"
                        ? "text-emerald-400"
                        : networkQuality === "relay"
                        ? "text-blue-400"
                        : "text-amber-400"
                    )}
                  >
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
                      <motion.div
                        key={i}
                        animate={{ height: [4, 8, 4] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        className="w-0.5 bg-blue-500/60"
                      />
                    ))}
                  </div>
                  {totalConnected + 1} Operative{totalConnected + 1 !== 1 ? "s" : ""} Linked
                </>
              ) : (
                "Encryption Layer Offline"
              )}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {!isActive ? (
            <button
              onClick={joinChannel}
              disabled={!currentUser.id}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border active:scale-95",
                !currentUser.id
                  ? "bg-white/5 border-white/10 text-slate-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40 border-blue-400/30"
              )}
            >
              {!currentUser.id ? "Identity Missing" : "Establish Link"}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
              <button
                onClick={toggleMute}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                  isMuted
                    ? "bg-red-500 text-white"
                    : "hover:bg-white/5 text-slate-400 hover:text-white"
                )}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <button
                onClick={leaveChannel}
                className="w-10 h-10 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-red-600/20"
              >
                <PhoneOff size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
          >
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">
              {error}
            </span>
          </motion.div>
        )}

        {/* Active Peers Grid */}
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="flex flex-wrap gap-4 overflow-hidden"
          >
            {/* Local */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl border flex items-center justify-center relative transition-all duration-300",
                  activeSpeakers[`${currentUser.id}:${sessionId}`]
                    ? "border-blue-500 ring-4 ring-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.3)] bg-blue-500/10"
                    : "border-white/10 bg-white/5",
                  isMuted && "opacity-40 grayscale"
                )}
              >
                <div className="text-[12px] font-black text-white uppercase">
                  {currentUser.name.substring(0, 2)}
                </div>
                {activeSpeakers[`${currentUser.id}:${sessionId}`] && !isMuted && (
                  <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 bg-[#0d152a] rounded-md border border-blue-500/30">
                    {[0, 100, 200].map((d) => (
                      <div
                        key={d}
                        className="w-1 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                )}
                {isMuted && (
                  <MicOff
                    size={12}
                    className="absolute -top-1 -right-1 text-red-500 bg-[#0d152a] rounded-full p-0.5 border border-red-500/30"
                  />
                )}
              </div>
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">
                You
              </span>
            </div>

            {/* Peers */}
            {peerList.map(([peerKey, peer]) => (
              <div key={peerKey} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl border flex items-center justify-center relative transition-all duration-300 shadow-lg",
                    peer.state === "failed"
                      ? "border-red-500/50 bg-red-500/5"
                      : peer.state === "connecting"
                      ? "border-amber-500/50 bg-amber-500/5"
                      : activeSpeakers[peerKey]
                      ? "border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/10"
                      : "border-white/10 bg-white/5"
                  )}
                >
                  <div className="text-[12px] font-black text-white uppercase">
                    {peer.userName.substring(0, 2)}
                  </div>
                  {/* Processed (boosted + EQ'd) audio plays through a real <audio> element.
                      srcObject = the MediaStream from our Web Audio destination node. */}
                  <audio
                    autoPlay
                    playsInline
                    controls={false}
                    ref={(el) => {
                      if (el) {
                        const src = processedStreams[peerKey] || peer.stream;
                        if (el.srcObject !== src) {
                          el.srcObject = src;
                          el.volume = 1.0;
                          el.play().catch(() => {
                            // Secondary fallback attempt if play fails (might need interaction)
                            console.warn("Audio tag blocked, waiting for gesture...");
                          });
                        }
                      }
                    }}
                    className="absolute opacity-0 pointer-events-none w-px h-px overflow-hidden"
                  />
                  {peer.state === "connecting" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="absolute -top-1 -right-1 bg-[#0d152a] rounded-full p-0.5 border border-amber-500/30"
                    >
                      <RefreshCw size={8} className="text-amber-400" />
                    </motion.div>
                  )}
                  {peer.state === "failed" && (
                    <WifiOff
                      size={10}
                      className="absolute -top-1 -right-1 text-red-500 bg-[#0d152a] rounded-full p-0.5 border border-red-500/30"
                    />
                  )}
                  {peer.state === "connected" && activeSpeakers[peerKey] && (
                    <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 bg-[#0d152a] rounded-md border border-emerald-500/30">
                      {[0, 100, 200].map((d) => (
                        <div
                          key={d}
                          className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] max-w-[56px] truncate text-center">
                  {peer.userName}
                </span>
              </div>
            ))}

            {/* Waiting state */}
            {peerList.length === 0 && (
              <div className="flex-1 h-14 flex items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em] animate-pulse">
                  Awaiting peers on any network…
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
              DTLS-SRTP Encrypted
            </span>
          </div>
          <div className="w-[1px] h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Signal size={12} className="text-blue-500" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
              STUN + TURN Mesh
            </span>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            <Volume2 size={10} className="text-blue-500/60" />
            <span className="text-[8px] font-bold text-slate-600 uppercase tabular-nums">
              CROSS_NET_READY
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
