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
    Newspaper,
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

import { useInvestigationStore } from "@/store/investigationStore";
import { getUserCases, createCase } from "@/app/actions/case";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";

const navItems: NavItem[] = [
    { icon: <LayoutDashboard size={16} />, label: "Dashboard", href: "/" },
    { icon: <FolderOpen size={16} />, label: "Cases", href: "/cases", badge: 3 },
    { icon: <Archive size={16} />, label: "Evidence Library", href: "/evidence" },
    { icon: <Users size={16} />, label: "Entities", href: "/entities" },
    { icon: <Clock size={16} />, label: "Timeline", href: "/timeline" },
    { icon: <Newspaper size={16} />, label: "News Feed", href: "/news" },
    { icon: <Brain size={16} />, label: "AI Intelligence", href: "/intelligence", badge: 5 },
    { icon: <MessageSquare size={16} />, label: "Collaboration", href: "/collaboration" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { toggleAIPanel, loadCaseData, currentCaseId } = useInvestigationStore();
    const [userCases, setUserCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchCases = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const casesData = await getUserCases(user.id);
                setUserCases(casesData);
                
                // Get last active case from localStorage
                const lastCaseId = localStorage.getItem("astraeus_last_case_id");
                const caseExists = casesData.find(c => c.id === lastCaseId);

                if (caseExists) {
                    loadCaseData(lastCaseId as string);
                } else if (casesData.length > 0 && !currentCaseId) {
                    loadCaseData(casesData[0].id);
                }
            }
            setLoading(false);
        };
        fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectCase = (caseId: string) => {
        localStorage.setItem("astraeus_last_case_id", caseId);
        loadCaseData(caseId);
    };

    const handleCreateCase = async () => {
        const title = prompt("Enter Case Title:");
        if (!title) return;

        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const newCase = await createCase(title, user.id);
                setUserCases([newCase, ...userCases]);
                loadCaseData(newCase.id);
            }
        } catch (error) {
            console.error("Failed to create case:", error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <aside
            className="flex flex-col w-64 min-w-[256px] h-full bg-[#0d1424] border-r border-[#1e3a5f]/40 z-10"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e3a5f]/50">
                <img 
                    src="/logo.png" 
                    alt="Astraeus Logo" 
                    className="h-10 w-auto object-contain brightness-0 invert"
                />
            </div>

            {/* Cases Section */}
            <div className="px-3 pt-4 pb-2">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Cases</span>
                    <button 
                        onClick={handleCreateCase}
                        disabled={creating}
                        className="p-1 hover:bg-white/5 rounded text-blue-400 transition-colors disabled:opacity-50"
                    >
                        {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    </button>
                </div>
                <div className="space-y-1">
                    {loading ? (
                        <div className="px-3 py-2 text-xs text-slate-600 font-mono tracking-tighter">Initializing Database...</div>
                    ) : userCases.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-600 italic font-mono">No cases assigned</div>
                    ) : (
                        userCases.map((c: any) => {
                            const isActive = currentCaseId === c.id;
                            return (
                                <div
                                    key={c.id}
                                    onClick={() => handleSelectCase(c.id)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group",
                                        isActive
                                            ? "bg-blue-500/10 border border-blue-500/20"
                                            : "hover:bg-white/5"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-xs font-medium truncate max-w-[120px]",
                                            isActive ? "text-blue-300" : "text-slate-400 group-hover:text-slate-300"
                                        )}
                                    >
                                        {c.title}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest",
                                            isActive
                                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                : "bg-slate-800 text-slate-600 border border-transparent"
                                        )}
                                    >
                                        {c.status}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1e3a5f]/60 to-transparent mx-4 my-2" />

            {/* Navigation */}
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

        </aside>
    );
}
