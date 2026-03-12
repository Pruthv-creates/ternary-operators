import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AIAssistantLoading() {
    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
                <Sparkles size={14} className="animate-spin-slow" />
            </div>
            <div className="bg-[#1e293b]/80 border border-slate-800/50 rounded-2xl px-4 py-3 flex gap-1 items-center">
                {[0, 1, 2].map(d => (
                    <motion.div
                        key={d}
                        className="w-1 h-1 rounded-full bg-indigo-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                    />
                ))}
            </div>
        </div>
    );
}
