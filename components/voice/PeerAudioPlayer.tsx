import { useRef, useEffect } from "react";

export function PeerAudioPlayer({ stream, peerKey }: { stream: MediaStream; peerKey: string }) {
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
        return () => document.removeEventListener("click", resume);
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
