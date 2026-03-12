import { motion } from "framer-motion";
import { useInvestigationStore } from "@/store/investigationStore";
import { useState, useEffect } from "react";

interface HypothesisNoteProps {
    id?: string;
    text: string;
    rotate?: number;
    prefix?: string;
}

export default function HypothesisNote({ id, text, rotate = -2, prefix = "HYPOTHESIS:" }: HypothesisNoteProps) {
    const { updateStickyText } = useInvestigationStore();
    const [isEditing, setIsEditing] = useState(false);
    const [localText, setLocalText] = useState(text);

    // Sync from props
    useEffect(() => {
        setLocalText(text);
    }, [text]);

    const handleBlur = () => {
        setIsEditing(false);
        if (id && localText !== text) {
            updateStickyText(id, localText);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: rotate - 5 }}
            animate={{ opacity: 1, scale: 1, rotate: rotate }}
            whileHover={{ scale: 1.04, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="cursor-grab active:cursor-grabbing"
            style={{ transform: `rotate(${rotate}deg)` }}
        >
            <div className="relative w-44 shadow-lg min-h-[140px] flex flex-col pointer-events-auto" style={{ backgroundColor: '#fef08a' }}>
                {/* Fold corner effect */}
                <div
                    className="absolute bottom-0 right-0 w-6 h-6 z-10"
                    style={{ backgroundColor: 'transparent' }}
                >
                    {/* Background cut out illusion behind fold */}
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[#0a0f1c]" />
                    {/* The folded part itself */}
                    <div className="absolute top-0 right-0 w-full h-full shadow-[-2px_-2px_4px_rgba(0,0,0,0.15)]" style={{ backgroundColor: '#fcd34d', clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
                </div>

                {/* Text Container */}
                <div className="p-4 pr-6 flex-1 flex flex-col text-[12px] font-medium leading-relaxed break-words" style={{ color: '#000000' }}>
                    <span className="font-bold mb-1.5 block">{prefix}</span>
                    {isEditing ? (
                        <textarea
                            autoFocus
                            value={localText}
                            onChange={(e) => setLocalText(e.target.value)}
                            onBlur={handleBlur}
                            className="bg-transparent border-none outline-none resize-none w-full flex-1 font-medium leading-relaxed nodrag nowheel placeholder:text-black/40"
                            style={{ color: '#000000' }}
                            placeholder="Type here..."
                            rows={4}
                        />
                    ) : (
                        <div
                            className="leading-relaxed block flex-1 min-h-[60px] whitespace-pre-wrap cursor-text"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (localText === "Click to edit text...") {
                                    setLocalText("");
                                }
                                setIsEditing(true);
                            }}
                        >
                            {localText && localText !== "Click to edit text..." ? localText : <span className="italic" style={{ color: 'rgba(0,0,0,0.5)' }}>Type here...</span>}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
