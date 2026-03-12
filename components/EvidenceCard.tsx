import { motion } from "framer-motion";
import { EvidenceItem } from "@/lib/data";
import { cn } from "@/lib/utils";

interface EvidenceCardProps {
    item: EvidenceItem;
}

const getCredibilityColor = (score: number) => {
    if (score >= 90) return "bg-emerald-400";
    if (score >= 70) return "bg-amber-400";
    return "bg-red-400";
};

export default function EvidenceCard({ item }: EvidenceCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={cn(
                "evidence-card rounded-xl p-3 w-56 cursor-pointer",
                "bg-[#1e293b]/90 border border-slate-700/50 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            )}
        >
            <div className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase mb-1.5">
                Evidence
            </div>

            <div className="text-[11px] font-bold text-slate-200 leading-tight uppercase tracking-wide mb-3">
                {item.title}
            </div>

            {/* Credibility */}
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Credibility:</span>
                    <span className="text-[10px] font-semibold text-emerald-400">{item.credibility}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.credibility}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className={cn("h-full rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]", getCredibilityColor(item.credibility))}
                    />
                </div>
            </div>

            {/* Timestamp */}
            <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="text-[9px] text-slate-400 mb-0.5">Timestamp:</div>
                <div className="text-[10px] text-slate-500">{item.timestamp}</div>
            </div>
        </motion.div>
    );
}
