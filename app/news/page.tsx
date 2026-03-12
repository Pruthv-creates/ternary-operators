"use client";

import { useEffect, useState } from "react";
import { useInvestigationStore } from "@/store/investigationStore";
import { getCaseNews } from "@/app/actions/case";
import { fetchLiveIntelligence, correlateNewsToCase } from "@/app/actions/news";
import { 
    Newspaper, 
    ExternalLink, 
    TrendingUp, 
    TrendingDown, 
    Minus,
    AlertCircle,
    Calendar,
    Share2,
    ShieldCheck,
    Search,
    Filter,
    ArrowUpRight,
    RefreshCw,
    Globe,
    Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content?: string;
    source: string;
    url?: string;
    publishedAt: Date;
    sentiment?: string;
}

export default function NewsPage() {
    const { currentCaseId } = useInvestigationStore();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [correlatingIds, setCorrelatingIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchNews = async () => {
        if (!currentCaseId) return;
        setLoading(true);
        try {
            const data = await getCaseNews(currentCaseId);
            // Convert string dates to Date objects if needed
            const formattedData = data.map((item: any) => ({
                ...item,
                publishedAt: new Date(item.publishedAt)
            }));
            setNews(formattedData);
        } catch (error) {
            console.error("Failed to fetch news:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!currentCaseId) return;
        setRefreshing(true);
        try {
            const res = await fetchLiveIntelligence(currentCaseId);
            if (res.success) {
                await fetchNews();
            }
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleCorrelate = async (newsId: string) => {
        setCorrelatingIds(prev => new Set(prev).add(newsId));
        try {
            const res = await correlateNewsToCase(newsId);
            if (res.success) {
                alert("Intelligence promoted to investigation graph!");
            } else {
                alert("Failed to correlate. " + (res.error || ""));
            }
        } catch (error) {
            console.error("Correlation error:", error);
        } finally {
            setCorrelatingIds(prev => {
                const next = new Set(prev);
                next.delete(newsId);
                return next;
            });
        }
    };

    useEffect(() => {
        fetchNews();
    }, [currentCaseId]);

    const filteredNews = news.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.source.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filter === "all") return matchesSearch;
        return matchesSearch && item.sentiment?.toLowerCase() === filter.toLowerCase();
    });

    const getSentimentIcon = (sentiment?: string) => {
        switch (sentiment?.toLowerCase()) {
            case "positive": return <TrendingUp size={14} className="text-emerald-400" />;
            case "negative": return <TrendingDown size={14} className="text-red-400" />;
            default: return <Minus size={14} className="text-slate-400" />;
        }
    };

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment?.toLowerCase()) {
            case "positive": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "negative": return "bg-red-500/10 text-red-400 border-red-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c] text-slate-200">
            {/* Header Area */}
            <div className="px-8 py-6 border-b border-[#1e3a5f]/30 bg-[#0d1424]/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Newspaper size={18} className="text-blue-400" />
                            <h1 className="text-xl font-bold tracking-tight text-white">Real-Time News Monitoring</h1>
                        </div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                            Synthesized global intelligence related to the current investigation
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
                            {refreshing ? "Correlating Feed..." : "Refresh Intelligence"}
                        </motion.button>

                        <div className="h-8 w-px bg-[#1e3a5f]/30 mx-2" />

                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search intel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-[#162035] border border-[#1e3a5f]/50 rounded-lg text-xs outline-none focus:border-blue-500/50 transition-all w-48 xl:w-64 shadow-inner"
                            />
                        </div>

                        <div className="flex bg-[#162035] p-1 rounded-lg border border-[#1e3a5f]/50">
                            {["all", "negative", "positive"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                                        filter === f 
                                            ? "bg-slate-700 text-white shadow-lg" 
                                            : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#1e3a5f]/20">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Scan Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400">
                        <Globe size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sources: OSINT, Reuters, Bellingcat</span>
                    </div>
                    <div className="flex-1" />
                    <div className="text-[10px] text-slate-500 font-mono tracking-tighter">
                        Last Intel Sync: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                        <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin" />
                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Scanning Global Feeds...</p>
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] border-2 border-dashed border-[#1e3a5f]/20 rounded-2xl bg-[#0d1424]/30">
                        <div className="p-4 rounded-full bg-slate-800/50 mb-4 text-slate-500">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">No Intel Found</h3>
                        <p className="text-slate-500 text-sm max-w-md text-center">
                            We couldn't find any news correlating to your current investigation parameters. Try adjusting your search or case filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
                        <AnimatePresence mode="popLayout">
                            {filteredNews.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="group relative flex flex-col bg-[#0d1424]/80 border border-[#1e3a5f]/30 rounded-xl overflow-hidden hover:border-blue-500/40 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:bg-[#0d1424]"
                                >
                                    {/* Source Bar */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-[#11192d] border-b border-[#1e3a5f]/20">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded overflow-hidden bg-slate-800 flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-blue-400">{item.source[0]}</span>
                                            </div>
                                            {item.url ? (
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-blue-400 transition-colors">
                                                    {item.source}
                                                </a>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 transition-colors">
                                                    {item.source}
                                                </span>
                                            )}
                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Calendar size={11} />
                                                <span className="text-[10px] whitespace-nowrap">
                                                    {item.publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            {item.url?.includes('youtube.com') && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest ml-2">
                                                    <Play size={10} fill="currentColor" />
                                                    Video Intel
                                                </div>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase racking-widest",
                                            getSentimentColor(item.sentiment)
                                        )}>
                                            {getSentimentIcon(item.sentiment)}
                                            {item.sentiment}
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <h2 className="text-base font-bold text-white leading-tight transition-colors">
                                                {item.url ? (
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline decoration-blue-500/30 underline-offset-4">
                                                        {item.title}
                                                    </a>
                                                ) : item.title}
                                            </h2>
                                            {item.url && (
                                                <motion.a 
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    whileHover={{ scale: 1.1 }}
                                                    className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-blue-600/20 cursor-pointer transition-all flex-shrink-0"
                                                >
                                                    <ExternalLink size={14} />
                                                </motion.a>
                                            )}
                                        </div>
                                        
                                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-6 flex-1">
                                            {item.summary}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-[#1e3a5f]/20 mt-auto">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-emerald-400/80">
                                                    <ShieldCheck size={13} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Source Verified</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-blue-400/80">
                                                    <Share2 size={13} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Internal Share</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleCorrelate(item.id)}
                                                disabled={correlatingIds.has(item.id)}
                                                className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                                            >
                                                {correlatingIds.has(item.id) ? (
                                                    <RefreshCw size={12} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        Correlate 
                                                        <ArrowUpRight size={12} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Decorator line */}
                                    <div className="absolute left-0 bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
