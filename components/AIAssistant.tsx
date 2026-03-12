"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { AIAssistantProps, Message, AttachedFile, SpeechRecognition } from "./ai/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { AIAssistantHeader } from "./ai/AIAssistantHeader";
import { AIAssistantMessageBubble } from "./ai/AIAssistantMessageBubble";
import { AIAssistantInput } from "./ai/AIAssistantInput";
import { AIAssistantSuggestions } from "./ai/AIAssistantSuggestions";
import { AIAssistantLoading } from "./ai/AIAssistantLoading";

export default function AIAssistant({ actions, askAI, isPanel, onClose }: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Analyzed 'Global Trading Corp' links. Found nexus to Sarah Jensen, announced with Investigation and analysis or marketing investigation.",
            timestamp: new Date()
        }
    ]);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userInitial, setUserInitial] = useState("U");

    // File attachment state
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    
    // Voice input state
    const [isRecording, setIsRecording] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    // ── Auth & scroll ──────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setUserInitial(data.user.email[0].toUpperCase());
            else if (data.user?.user_metadata?.full_name)
                setUserInitial(data.user.user_metadata.full_name[0].toUpperCase());
        });
    }, []);

    useEffect(() => {
        if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading]);

    // ── Speech Recognition init ────────────────────────────────────
    useEffect(() => {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
            setVoiceSupported(true);
            const recognition = new SpeechRec();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results as any[])
                    .map((r: any) => r[0].transcript)
                    .join("");
                setQuestion(transcript);
            };

            recognition.onend = () => setIsRecording(false);
            recognition.onerror = () => setIsRecording(false);

            recognitionRef.current = recognition;
        }
    }, []);

    // ── Voice toggle ───────────────────────────────────────────────
    const toggleVoice = useCallback(() => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setQuestion("");
            recognitionRef.current.start();
            setIsRecording(true);
        }
    }, [isRecording]);

    // ── File handling ──────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        const parsed: AttachedFile[] = await Promise.all(
            files.map(async (file) => {
                let preview: string | undefined;
                if (
                    file.type.startsWith("text/") ||
                    file.name.endsWith(".csv") ||
                    file.name.endsWith(".json") ||
                    file.name.endsWith(".md") ||
                    file.name.endsWith(".txt")
                ) {
                    preview = await file.text().then(t => t.slice(0, 3000));
                }
                return { name: file.name, size: file.size, type: file.type, preview };
            })
        );

        setAttachedFiles(prev => [...prev, ...parsed]);
        if (e.target) e.target.value = "";
    };

    const removeFile = (index: number) =>
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));

    // ── Send message ───────────────────────────────────────────────
    async function handleAsk(q?: string) {
        const query = (q ?? question).trim();
        if ((!query && attachedFiles.length === 0) || !askAI) return;

        let enrichedQuery = query;
        const textFiles = attachedFiles.filter(f => f.preview);
        if (textFiles.length > 0) {
            enrichedQuery +=
                "\n\n---\nThe following files were attached by the user:\n" +
                textFiles.map(f => `\n[File: ${f.name}]\n${f.preview}`).join("\n");
        }

        const userMsg: Message = {
            role: "user",
            content: query || `[Attached ${attachedFiles.length} file(s)]`,
            timestamp: new Date(),
            attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
        };

        setMessages(prev => [...prev, userMsg]);
        setQuestion("");
        setAttachedFiles([]);
        setLoading(true);
        setError(null);

        try {
            const result = await askAI(enrichedQuery || `Analyze the attached files: ${attachedFiles.map(f => f.name).join(", ")}`);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: result.answer,
                timestamp: new Date()
            }]);
        } catch (err) {
            console.error("AI error:", err);
            setError("Failed to reach Astra AI backend.");
        } finally {
            setLoading(false);
        }
    }

    const canSend = (question.trim().length > 0 || attachedFiles.length > 0) && !loading;

    return (
        <div className={cn(
            "bg-[#0d1424] flex flex-col h-full overflow-hidden",
            !isPanel && "border border-[#1e3a5f]/70 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] w-[350px] fixed bottom-4 right-4 z-50"
        )}>
            <AIAssistantHeader isPanel={isPanel} onClose={onClose} />

            <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto scroll-smooth custom-scrollbar p-4 flex flex-col gap-6"
            >
                {messages.map((msg, i) => (
                    <AIAssistantMessageBubble 
                        key={i} 
                        message={msg} 
                        userInitial={userInitial} 
                    />
                ))}

                {loading && <AIAssistantLoading />}

                {error && (
                    <div className="text-[10px] text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 flex items-center gap-2">
                        <AlertTriangle size={12} />
                        {error}
                    </div>
                )}

                {!loading && (
                    <AIAssistantSuggestions 
                        actions={actions} 
                        handleAsk={handleAsk} 
                    />
                )}
            </div>

            <AIAssistantInput 
                question={question}
                setQuestion={setQuestion}
                attachedFiles={attachedFiles}
                handleFileChange={handleFileChange}
                removeFile={removeFile}
                isRecording={isRecording}
                voiceSupported={voiceSupported}
                toggleVoice={toggleVoice}
                handleAsk={handleAsk}
                loading={loading}
                canSend={canSend}
            />
        </div>
    );
}
