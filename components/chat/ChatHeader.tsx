import { Shield, Zap, MoreHorizontal, Terminal } from "lucide-react";

export function ChatHeader() {
    return (
        <header className="flex-shrink-0 px-8 py-6 border-b border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent flex items-center justify-between z-20">
            <div className="flex items-center gap-5">
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/40 transition-all rounded-full" />
                    <div className="w-12 h-12 rounded-2xl bg-[#0d152a] border border-blue-500/30 flex items-center justify-center relative shadow-2xl">
                        <Shield size={22} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Intel Feed</h3>
                        <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Secure High</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] flex items-center gap-1.5">
                        <Terminal size={10} /> Node: OPS_A_77
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <Zap size={14} />
                </button>
                <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <MoreHorizontal size={14} />
                </button>
            </div>
        </header>
    );
}
