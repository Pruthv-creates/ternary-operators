import { useRef, useState } from "react";
import { useInvestigationStore } from "@/store/investigationStore";

import { toast } from "sonner";

export function useTimelineLogic() {
    const { addStickyNote, addEvidenceCard } = useInvestigationStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/ai/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                addEvidenceCard(file.name.toUpperCase(), { x: 700, y: 400 });
                toast.success(`Evidence successfully ingested: ${file.name}`);
            } else {
                toast.error("Upload failed. Ensure backend is running.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An error occurred during upload.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleAddHypothesis = () => {
        addStickyNote({ x: 100, y: 600 }, "Investigate logic nexus...");
    };

    return {
        fileInputRef,
        uploading,
        handleFileUpload,
        handleAddHypothesis
    };
}
