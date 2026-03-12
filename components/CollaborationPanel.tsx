"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Phone, PhoneOff, Users } from "lucide-react";

interface CollaborationProps {
    roomId: string; // The case ID or specific collaboration room
}

export default function CollaborationPanel({ roomId }: CollaborationProps) {
    const [isCalling, setIsCalling] = useState(false);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localVideo = useRef<HTMLVideoElement | null>(null);
    const remoteVideo = useRef<HTMLVideoElement | null>(null);

    // 1. Initialize WebRTC signaling via Supabase Broadcast
    useEffect(() => {
        const channel = supabase.channel(`room:${roomId}`, {
            config: { broadcast: { self: false } },
        });

        channel
            .on("broadcast", { event: "webrtc-signal" }, async ({ payload }) => {
                if (payload.type === "offer") {
                    await handleOffer(payload.offer);
                } else if (payload.type === "answer") {
                    await handleAnswer(payload.answer);
                } else if (payload.type === "ice-candidate") {
                    await handleIceCandidate(payload.candidate);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    const startCall = async () => {
        setIsCalling(true);
        // Step 1: Create Peer Connection
        peerConnection.current = createPeerConnection();

        // Step 2: Get Media Stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo.current) localVideo.current.srcObject = stream;
        stream.getTracks().forEach((track) => peerConnection.current?.addTrack(track, stream));

        // Step 3: Create and Send Offer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        await supabase.channel(`room:${roomId}`).send({
            type: "broadcast",
            event: "webrtc-signal",
            payload: { type: "offer", offer },
        });
    };

    // Helper functions for WebRTC signaling logic
    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                supabase.channel(`room:${roomId}`).send({
                    type: "broadcast",
                    event: "webrtc-signal",
                    payload: { type: "ice-candidate", candidate: event.candidate },
                });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
        };

        return pc;
    };

    const handleOffer = async (_offer: RTCSessionDescriptionInit) => {
        // Handle incoming call (similar logic to startCall but creating an Answer)
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
        await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    };

    return (
        <div className="bg-[#1a2333] border border-slate-800 rounded-xl p-4 w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <Users className="text-blue-400" size={18} />
                    <h3 className="text-sm font-semibold text-white">Live Investigation Room</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 h-48">
                <div className="bg-black/50 rounded-lg overflow-hidden border border-slate-800 relative">
                    <video ref={localVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-blue-400 border border-blue-500/30">You</span>
                </div>
                <div className="bg-black/50 rounded-lg overflow-hidden border border-slate-800 relative">
                    <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/30">Investigator</span>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                {!isCalling ? (
                    <button
                        onClick={startCall}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-all"
                    >
                        <Phone size={16} /> Start Collaboration
                    </button>
                ) : (
                    <button
                        onClick={() => setIsCalling(false)}
                        className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                        <PhoneOff size={16} /> End Call
                    </button>
                ) }
            </div>
        </div>
    );
}
