import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useInvestigationStore } from "@/store/investigationStore";
import {
    LayoutDashboard,
    FolderOpen,
    Archive,
    Users,
    Clock,
    Brain,
    MessageSquare,
    Newspaper,
} from "lucide-react";

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: number;
}

const navItems: NavItem[] = [
    { icon: <LayoutDashboard size={16} />, label: "Dashboard", href: "/" },
    { icon: <FolderOpen size={16} />, label: "Cases", href: "/cases" },
    { icon: <Archive size={16} />, label: "Evidence Library", href: "/evidence" },
    { icon: <Clock size={16} />, label: "Timeline", href: "/timeline" },
    { icon: <Newspaper size={16} />, label: "News Feed", href: "/news" },
    { icon: <Brain size={16} />, label: "AI Intelligence", href: "/intelligence" },
    { icon: <MessageSquare size={16} />, label: "Collaboration", href: "/collaboration" },
];

export function SidebarNav() {
    const pathname = usePathname();
    const { toggleAIPanel } = useInvestigationStore();

    return (
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto mt-2">
            {navItems.map((item: NavItem) => {
                const isActive = item.href === "/" 
                    ? pathname === "/" 
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                const isAI = item.label === "AI Intelligence";

                const ItemContent = (
                    <motion.div
                        whileHover={{ x: 2 }}
                        onClick={isAI ? (e) => {
                            e.preventDefault();
                            toggleAIPanel();
                        } : undefined}
                        className={cn(
                            "sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group relative",
                            isActive
                                ? "bg-blue-500/15 text-blue-300 shadow-sm shadow-blue-500/5 transition-all duration-300"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                        )}
                    >
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-400 rounded-r shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                        )}
                        <span className={cn(isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300 transition-colors")}>
                            {item.icon}
                        </span>
                        <span className="text-xs font-medium flex-1">{item.label}</span>
                        {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                                {item.badge}
                            </span>
                        )}
                    </motion.div>
                );

                return isAI ? (
                    <div key={item.label}>{ItemContent}</div>
                ) : (
                    <Link key={item.label} href={item.href}>
                        {ItemContent}
                    </Link>
                );
            })}
        </nav>
    );
}
