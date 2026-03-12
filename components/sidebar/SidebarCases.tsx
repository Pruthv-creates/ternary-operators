import { Plus, Loader2, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
    handleRenameCase: (caseId: string, newTitle: string) => Promise<void>;
}

export function SidebarCases({
    userCases,
    loading,
    creating,
    currentCaseId,
    handleSelectCase,
    handleCreateCase,
    handleRenameCase,
}: SidebarCasesProps) {
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const startRenaming = (e: React.MouseEvent, c: any) => {
        e.stopPropagation();
        setRenamingId(c.id);
        setEditTitle(c.title);
    };

    const cancelRenaming = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRenamingId(null);
    };

    const submitRename = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            await handleRenameCase(id, editTitle.trim());
        }
        setRenamingId(null);
    };

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
                        const isRenaming = renamingId === c.id;

                        return (
                            <div
                                key={c.id}
                                onClick={() => !isRenaming && handleSelectCase(c.id)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 group/item",
                                    isActive
                                        ? "bg-blue-500/10 border border-blue-500/20"
                                        : "hover:bg-white/5 border border-transparent",
                                    isRenaming ? "cursor-default ring-1 ring-blue-500/50" : "cursor-pointer"
                                )}
                            >
                                {isRenaming ? (
                                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                        <input 
                                            autoFocus
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') submitRename(e as any, c.id);
                                                if (e.key === 'Escape') cancelRenaming(e as any);
                                            }}
                                            className="bg-transparent text-xs text-blue-300 border-none focus:ring-0 p-0 w-full font-medium"
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={e => submitRename(e, c.id)} className="text-emerald-500 hover:text-emerald-400">
                                                <Check size={12} />
                                            </button>
                                            <button onClick={cancelRenaming} className="text-slate-500 hover:text-slate-400">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                            <span
                                                className={cn(
                                                    "text-xs font-medium truncate",
                                                    isActive ? "text-blue-300" : "text-slate-400 group-hover/item:text-slate-200"
                                                )}
                                            >
                                                {c.title}
                                            </span>
                                            <button 
                                                onClick={e => startRenaming(e, c)}
                                                className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all text-slate-500 hover:text-blue-400"
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest shrink-0",
                                                isActive
                                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                    : "bg-slate-800 text-slate-600 border border-transparent"
                                            )}
                                        >
                                            {c.status}
                                        </span>
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
