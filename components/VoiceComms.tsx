"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, PhoneOff, Users, Radio, Signal, Volume2, ShieldCheck, Headphones } from "lucide-react";
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
}

interface PeerConnection {
  connection: RTCPeerConnection;
  stream: MediaStream;
  userName: string;
  sessionId: string;
}

export default function VoiceComms({ caseId, currentUser }: VoiceCommsProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [peers, setPeers] = useState<Record<string, PeerConnection>>({});
  const [activeSpeakers, setActiveSpeakers] = useState<Record<string, boolean>>({});
  
  const sessionId = useRef(Math.random().toString(36).substring(7)).current;
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const channelRef = useRef<any>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Record<string, AnalyserNode>>({});

  const cleanupPeer = useCallback((peerKey: string) => {
    if (peerConnections.current[peerKey]) {
      peerConnections.current[peerKey].close();
      delete peerConnections.current[peerKey];
    }
    setPeers(prev => {
      const newPeers = { ...prev };
      delete newPeers[peerKey];
      return newPeers;
    });
    if (analysersRef.current[peerKey]) {
        delete analysersRef.current[peerKey];
    }
    setActiveSpeakers(prev => {
        const next = { ...prev };
        delete next[peerKey];
        return next;
    });
  }, []);

  const setupAudioAnalysis = useCallback((key: string, stream: MediaStream) => {
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Re-use source if audio context is running
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 64; // Smaller for performance
        source.connect(analyser);
        analysersRef.current[key] = analyser;

        const checkSpeaking = () => {
            if (!analysersRef.current[key] || !isActive) return;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            setActiveSpeakers(prev => ({
                ...prev,
                [key]: average > 25
            }));

            requestAnimationFrame(checkSpeaking);
        };
        checkSpeaking();
    } catch (e) {
        console.warn("Audio analysis setup failed", e);
    }
  }, [isActive]);

  const createPeerConnection = useCallback(async (targetUserId: string, targetSessionId: string, userName: string, isInitiator: boolean) => {
    const peerKey = `${targetUserId}:${targetSessionId}`;
    if (peerConnections.current[peerKey]) return peerConnections.current[peerKey];

    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    };

    const pc = new RTCPeerConnection(config);
    peerConnections.current[peerKey] = pc;

    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current!);
        });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: {
            candidate: event.candidate,
            from: currentUser.id,
            fromSession: sessionId,
            to: targetUserId,
            toSession: targetSessionId
          }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`📡 Linked stream with ${userName}`);
      setPeers(prev => ({
        ...prev,
        [peerKey]: {
          connection: pc,
          stream: event.streams[0],
          userName: userName,
          sessionId: targetSessionId
        }
      }));
      setupAudioAnalysis(peerKey, event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            cleanupPeer(peerKey);
        }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      channelRef.current.send({
        type: "broadcast",
        event: "voice-offer",
        payload: {
          offer,
          from: currentUser.id,
          fromSession: sessionId,
          fromName: currentUser.name,
          to: targetUserId,
          toSession: targetSessionId
        }
      });
    }

    return pc;
  }, [currentUser.id, currentUser.name, sessionId, setupAudioAnalysis, cleanupPeer]);

  const joinChannel = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      setIsActive(true);
      
      // Analyze our own audio
      setupAudioAnalysis(`${currentUser.id}:${sessionId}`, stream);

      channelRef.current.send({
        type: "broadcast",
        event: "voice-join",
        payload: {
          userId: currentUser.id,
          userName: currentUser.name,
          sessionId: sessionId
        }
      });
    } catch (err) {
      console.error("Microphone Access Blocked:", err);
      setIsActive(false);
    }
  };

  const leaveChannel = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    
    Object.keys(peerConnections.current).forEach(cleanupPeer);
    
    if (channelRef.current) {
        channelRef.current.send({
            type: "broadcast",
            event: "voice-leave",
            payload: { userId: currentUser.id, sessionId: sessionId }
        });
    }
    
    setIsActive(false);
    setActiveSpeakers({});
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
    }
  }, [cleanupPeer, currentUser.id, sessionId]);

  useEffect(() => {
    if (!caseId) return;

    channelRef.current = supabase.channel(`voice:${caseId}`, {
        config: {
            broadcast: { self: false }
        }
    });
    
    channelRef.current
      .on("broadcast", { event: "voice-join" }, async ({ payload }: any) => {
        if (payload.sessionId === sessionId) return;
        console.log("Team Member Joined Comms:", payload.userName);
        await createPeerConnection(payload.userId, payload.sessionId, payload.userName, true);
      })
      .on("broadcast", { event: "voice-offer" }, async ({ payload }: any) => {
        if (payload.toSession !== sessionId) return;
        const pc = await createPeerConnection(payload.from, payload.fromSession, payload.fromName, false);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        channelRef.current.send({
          type: "broadcast",
          event: "voice-answer",
          payload: {
            answer,
            from: currentUser.id,
            fromSession: sessionId,
            to: payload.from,
            toSession: payload.fromSession
          }
        });
      })
      .on("broadcast", { event: "voice-answer" }, async ({ payload }: any) => {
        if (payload.toSession !== sessionId) return;
        const peerKey = `${payload.from}:${payload.fromSession}`;
        const pc = peerConnections.current[peerKey];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }: any) => {
        if (payload.toSession !== sessionId) return;
        const peerKey = `${payload.from}:${payload.fromSession}`;
        const pc = peerConnections.current[peerKey];
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      .on("broadcast", { event: "voice-leave" }, ({ payload }: any) => {
        const peerKey = `${payload.userId}:${payload.sessionId}`;
        cleanupPeer(peerKey);
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
            console.log("🛰️ Comms Channel Verified");
        }
      });

    return () => {
      leaveChannel();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [caseId, createPeerConnection, cleanupPeer, currentUser.id, sessionId, leaveChannel]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  return (
    <div className="bg-[#0a0f1c]/40 border border-[#1e3a5f]/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden group shadow-lg">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,95,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,95,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    isActive ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] ring-1 ring-blue-400/50" : "bg-white/5 border border-white/10"
                )}>
                    {isActive ? (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Headphones size={22} className="text-white" />
                        </motion.div>
                    ) : (
                        <Users size={22} className="text-slate-500" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">Comms Channel</h4>
                        {isActive && (
                            <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-tighter">Live P2P</span>
                            </div>
                        )}
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5">
                        {isActive ? (
                            <>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3].map(i => (
                                        <motion.div 
                                            key={i}
                                            animate={{ height: [4, 8, 4] }}
                                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                            className="w-0.5 bg-blue-500/60"
                                        />
                                    ))}
                                </div>
                                {Object.keys(peers).length + 1} Operatives Linked
                            </>
                        ) : "Encryption Layer Offline"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {!isActive ? (
                    <button 
                        onClick={joinChannel}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-900/40 border border-blue-400/30 active:scale-95"
                    >
                        Establish Link
                    </button>
                ) : (
                    <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                        <button 
                            onClick={toggleMute}
                            className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                isMuted ? "bg-red-500 text-white" : "hover:bg-white/5 text-slate-400 hover:text-white"
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

        <AnimatePresence>
            {isActive && (
                <motion.div 
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="flex flex-wrap gap-4 overflow-hidden"
                >
                    {/* Local Feed */}
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl border flex items-center justify-center relative transition-all duration-300",
                            activeSpeakers[`${currentUser.id}:${sessionId}`] ? "border-blue-500 ring-4 ring-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.3)] bg-blue-500/10" : "border-white/10 bg-white/5",
                            isMuted && "opacity-40 grayscale"
                        )}>
                            <div className="text-[12px] font-black text-white uppercase">{currentUser.name.substring(0,2)}</div>
                            {activeSpeakers[`${currentUser.id}:${sessionId}`] && !isMuted && (
                                <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 bg-[#0d152a] rounded-md border border-blue-500/30">
                                    <div className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                    <div className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                </div>
                            )}
                            {isMuted && <MicOff size={12} className="absolute -top-1 -right-1 text-red-500 bg-[#0d152a] rounded-full p-0.5 border border-red-500/30" />}
                        </div>
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">Alpha (You)</span>
                    </div>

                    {/* Peer Feeds */}
                    {Object.entries(peers).map(([peerKey, peer]) => (
                        <div key={peerKey} className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl border flex items-center justify-center relative transition-all duration-300 shadow-lg",
                                activeSpeakers[peerKey] ? "border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/10" : "border-white/10 bg-white/5"
                            )}>
                                <div className="text-[12px] font-black text-white uppercase">{peer.userName.substring(0,2)}</div>
                                <audio autoPlay ref={el => { if(el) el.srcObject = peer.stream; }} hidden />
                                {activeSpeakers[peerKey] && (
                                    <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 bg-[#0d152a] rounded-md border border-emerald-500/30">
                                        <div className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                        <div className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                    </div>
                                )}
                            </div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{peer.userName}</span>
                        </div>
                    ))}

                    {isActive && Object.keys(peers).length === 0 && (
                        <div className="flex-1 h-14 flex items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                             <span className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em] animate-pulse">Awaiting encrypted connections...</span>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TLS 1.3 / DTLS</span>
                </div>
                <div className="w-[1px] h-3 bg-white/10" />
                <div className="flex items-center gap-1.5">
                    <Signal size={12} className="text-blue-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Low Latency Mesh</span>
                </div>
            </div>
            {isActive && (
                <div className="flex items-center gap-2">
                    <Volume2 size={10} className="text-blue-500/60" />
                    <span className="text-[8px] font-bold text-slate-600 uppercase tabular-nums">P2P_LINK_OK</span>
                </div>
            )}
        </div>
    </div>
  );
}
