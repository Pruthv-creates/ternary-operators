import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarCasesProps {
    userCases: any[];
    loading: boolean;
    creating: boolean;
    currentCaseId: string | null;
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (open: boolean) => void;
    handleSelectCase: (id: string) => void;
    handleCreateCase: () => void;
    handleCreateCaseWithTitle: (title: string) => Promise<void>;
}

export function SidebarCases({
    userCases,
    loading,
    creating,
    currentCaseId,
    handleSelectCase,
    handleCreateCase,
}: SidebarCasesProps) {
    return (
        <div className="px-3 pt-4 pb-2 text-slate-300">
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
                                    "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group/item",
                                    isActive
                                        ? "bg-blue-500/10 border border-blue-500/20"
                                        : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <span
                                    className={cn(
                                        "text-xs font-medium truncate max-w-[120px]",
                                        isActive ? "text-blue-300" : "text-slate-400 group-hover/item:text-slate-200"
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
    );
}
