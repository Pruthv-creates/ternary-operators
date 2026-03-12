"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    FolderOpen,
    Archive,
    Users,
    Clock,
    Brain,
    MessageSquare,
    Shield,
    ChevronRight,
    Hexagon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: number;
}

const navItems: NavItem[] = [
    { icon: <LayoutDashboard size={16} />, label: "Dashboard", href: "/" },
    { icon: <FolderOpen size={16} />, label: "Cases", href: "/cases", badge: 3 },
    { icon: <Archive size={16} />, label: "Evidence Library", href: "/evidence" },
    { icon: <Users size={16} />, label: "Entities", href: "/entities" },
    { icon: <Clock size={16} />, label: "Timeline", href: "/timeline" },
    { icon: <Brain size={16} />, label: "AI Intelligence", href: "/intelligence", badge: 5 },
    { icon: <MessageSquare size={16} />, label: "Collaboration", href: "/collaboration" },
];

const cases = [
    { name: "Project Nexus", active: true, status: "Active" },
    { name: "CyberThreat '24", active: false, status: "Review" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <motion.aside
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col w-64 min-w-[256px] h-full bg-[#0d1424] border-r border-[#1e3a5f]/40 z-10"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e3a5f]/50">
                <div className="relative flex items-center justify-center w-8 h-8">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm" />
                    <Hexagon size={22} className="text-blue-400 relative z-10" strokeWidth={1.5} />
                    <Shield size={10} className="text-blue-300 absolute z-20" />
                </div>
                <div>
                    <div className="text-sm font-bold tracking-widest text-white">ASTRAEUS</div>
                    <div className="text-[9px] text-slate-500 tracking-wider uppercase">Intelligence Command Centre</div>
                </div>
            </div>

            {/* Cases Section */}
            <div className="px-3 pt-4 pb-2">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Cases</span>
                    <ChevronRight size={12} className="text-slate-600" />
                </div>
                <div className="space-y-1">
                    {cases.map((c) => (
                        <div
                            key={c.name}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group",
                                c.active
                                    ? "bg-blue-500/10 border border-blue-500/20"
                                    : "hover:bg-white/5"
                            )}
                        >
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    c.active ? "text-blue-300" : "text-slate-400 group-hover:text-slate-300"
                                )}
                            >
                                {c.name}
                            </span>
                            <span
                                className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded font-medium",
                                    c.active
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-slate-800 text-slate-500"
                                )}
                            >
                                {c.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1e3a5f]/60 to-transparent mx-4 my-2" />

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto mt-2">
                {navItems.map((item) => {
                    const isActive = item.href === "/" 
                        ? pathname === "/" 
                        : pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link key={item.label} href={item.href}>
                            <motion.div
                                whileHover={{ x: 2 }}
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
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom status */}
            <div className="px-4 py-4 border-t border-[#1e3a5f]/50">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span>System Operational</span>
                </div>
            </div>
        </motion.aside>
    );
}
