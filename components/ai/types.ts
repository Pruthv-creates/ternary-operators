import { AIAction } from "@/lib/data";

export type AttachedFile = {
    name: string;
    size: number;
    type: string;
    preview?: string; // text preview for text-based files
};

export type Message = {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    attachments?: AttachedFile[];
};

export type AIResponse = {
    answer: string;
    sources: string[];
};

export interface AIAssistantProps {
    actions: AIAction[];
    askAI?: (question: string, caseId?: string) => Promise<AIResponse>;
    isPanel?: boolean;
    onClose?: () => void;
}

// Extend window type for SpeechRecognition
export interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
