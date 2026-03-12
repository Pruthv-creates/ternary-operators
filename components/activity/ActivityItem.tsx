import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ActivityItemProps {
    message: string;
    timestamp: Date;
    Icon: LucideIcon;
    iconColor: string;
}

export function ActivityItem({ message, timestamp, Icon, iconColor }: ActivityItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 py-2 px-3 bg-[#0d1424]/40 border border-[#1e3a5f]/20 rounded-xl hover:bg-[#1e293b]/50 transition-all font-sans group"
        >
            <div className={`p-1.5 rounded-lg bg-slate-800/80 group-hover:bg-slate-700/80 transition-colors ${iconColor}`}>
                <Icon size={12} />
            </div>
            <span className="flex-1 text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                {message}
            </span>
            <span className="text-[9px] font-bold text-slate-600 font-mono">
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </motion.div>
    );
}
