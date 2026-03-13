
"use client";

import { useEffect, useState } from "react";
import { 
    Clock, 
    Globe, 
    ExternalLink, 
    RefreshCw, 
    TrendingUp, 
    TrendingDown, 
    Minus,
    ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { correlateNewsToCase } from "@/app/actions/news";
import { TextHighlightPromoter } from "@/components/staging/TextHighlightPromoter";

import { toast } from "sonner";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  sentiment?: number;
}

interface NewsFeedProps {
  caseId: string;
}

export default function NewsFeed({ caseId }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [correlatingIds, setCorrelatingIds] = useState<Set<string>>(new Set());

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/news/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setNews(data);
      }
    } catch (error) {
      console.error("Failed to load news feed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCorrelate = async (e: React.MouseEvent, newsId: string) => {
    e.stopPropagation(); // Don't open link
    setCorrelatingIds(prev => new Set(prev).add(newsId));
    try {
      const res = await correlateNewsToCase(newsId);
      if (res.success) {
        toast.success("Intelligence promoted to investigation graph!");
      } else {
        toast.error("Failed to correlate: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Correlation error:", error);
      toast.error("Internal correlation error");
    } finally {
      setCorrelatingIds(prev => {
        const next = new Set(prev);
        next.delete(newsId);
        return next;
      });
    }
  };

  useEffect(() => {
    if (caseId) fetchNews();
  }, [caseId]);

  const getSentimentBadge = (sentiment?: number) => {
    if (sentiment === undefined || sentiment === 0) return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
        <Minus size={10} /> NEUTRAL
      </span>
    );
    if (sentiment > 0) return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
        <TrendingUp size={10} /> POSITIVE
      </span>
    );
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
        <TrendingDown size={10} /> NEGATIVE
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1424] border-l border-[#1e3a5f]/30">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a5f]/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Globe size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Global Intelligence</h2>
            <p className="text-[10px] text-slate-500 font-medium">Real-time OSINT Signal Feed</p>
          </div>
        </div>
        <button 
          onClick={() => fetchNews(true)}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Feed Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scanning Networks...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Globe size={32} className="text-slate-800 mb-4" />
            <p className="text-xs text-slate-500 font-medium">No intelligence signals detected for current case parameters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {news.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onDoubleClick={() => window.open(item.url, "_blank")}
                  className="group relative flex flex-col bg-[#11192d]/50 border border-[#1e3a5f]/20 rounded-xl p-4 cursor-default hover:bg-[#11192d] hover:border-blue-500/40 transition-all select-all shadow-sm shadow-black/20"
                >
                  <div className="flex gap-4">
                    {item.imageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-[#1e3a5f]/30">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">{item.source}</span>
                               <span className="text-[8px] text-slate-600">•</span>
                               <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                                 <Clock size={10} />
                                 {new Date(item.publishedAt).toLocaleDateString()}
                               </div>
                            </div>
                            <ExternalLink 
                              size={12} 
                              className="text-slate-600 group-hover:text-blue-400 transition-colors cursor-pointer" 
                              onClick={() => window.open(item.url, "_blank")}
                            />
                          </div>
                          
                          <TextHighlightPromoter
                            source={`${item.source}: ${item.title}`}
                          >
                            <h3 className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-2 leading-tight mb-2">
                              {item.title}
                            </h3>
                            
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                              {item.summary}
                            </p>
                          </TextHighlightPromoter>

                       <div className="flex items-center justify-between">
                         {getSentimentBadge(item.sentiment)}
                         
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); window.open(item.url, "_blank"); }}
                             className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
                           >
                              View Source
                           </button>

                           <button 
                             onClick={(e) => handleCorrelate(e, item.id)}
                             disabled={correlatingIds.has(item.id)}
                             className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 group/btn"
                           >
                             {correlatingIds.has(item.id) ? (
                               <RefreshCw size={12} className="animate-spin" />
                             ) : (
                               <>
                                 Correlate
                                 <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                               </>
                             )}
                           </button>
                         </div>
                       </div>
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-[#1e3a5f]/30 bg-[#0a0f1c]/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Signal Ingestion Active</span>
        </div>
      </div>
    </div>
  );
}
