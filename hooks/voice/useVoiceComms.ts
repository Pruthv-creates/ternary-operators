import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface PeerConnection {
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

const JOIN_SOUND_URL = "https://www.myinstants.com/media/sounds/discord-join.mp3";
const LEAVE_SOUND_URL = "https://www.myinstants.com/media/sounds/discord-leave.mp3";

const playSound = (url: string) => {
    try {
        const audio = new Audio(url);
        audio.volume = 0.4;
        audio.play().catch(() => {});
    } catch (e) {}
};

export function useVoiceComms(caseId: string, currentUser: { id: string, name: string }, onActiveChange?: (active: boolean) => void) {
    const [isActive, setIsActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
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
            source.connect(analyser); 
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

        const pc = new RTCPeerConnection({
            iceServers: ICE_SERVERS,
            iceTransportPolicy: "all",
        });
        peerConnections.current[peerKey] = pc;
        pendingCandidates.current[peerKey] = [];
        makingOfferRef.current[peerKey] = false;
        ignoreOfferRef.current[peerKey] = false;

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
    }, [currentUser.id, currentUser.name, sessionId, setupMetering, cleanupPeer, getAudioContext]);

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
    }, [getOrCreatePeerConnection, currentUser.id, currentUser.name, sessionId]);

    useEffect(() => {
        if (!caseId) return;
        const channel = supabase.channel(`voice-${caseId}`, {
            config: { broadcast: { self: false, ack: false }, presence: { key: sessionId } },
        });
        channelRef.current = channel;

        channel.on("broadcast", { event: "voice-join" }, async ({ payload }: any) => {
            if (payload.sessionId === sessionId) return;
            playSound(JOIN_SOUND_URL);
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
            if (isActiveRef.current) {
                playSound(LEAVE_SOUND_URL);
            }
            cleanupPeer(`${payload.userId}:${payload.sessionId}`);
        });

        channel.subscribe();
        return () => {
            leaveChannel();
            supabase.removeChannel(channel);
        };
    }, [caseId, initiateOffer, getOrCreatePeerConnection, currentUser.id, currentUser.name, sessionId, cleanupPeer]);

    const leaveChannel = useCallback(() => {
        if (isActiveRef.current) {
            playSound(LEAVE_SOUND_URL);
        }
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

    const joinChannel = async () => {
        try {
            setError(null);
            setNetworkQuality("unknown");
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: false,
            });
            await getAudioContext().resume();
            localStreamRef.current = stream;
            setIsActive(true);
            isActiveRef.current = true;
            playSound(JOIN_SOUND_URL);
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

    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        }
    };

    return {
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
    };
}
