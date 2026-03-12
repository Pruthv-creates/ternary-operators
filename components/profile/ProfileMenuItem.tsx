import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileMenuItemProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    badge?: string;
    onClick?: () => void;
    className?: string;
}

export function ProfileMenuItem({ icon, label, description, badge, onClick, className }: ProfileMenuItemProps) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left group",
                className
            )}
        >
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all font-sans">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{label}</span>
                    {badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{description}</p>
            </div>
            <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
        </button>
    );
}
