import { Agent } from "@/hooks/useCollaboratorInvite";

interface AgentResultItemProps {
    agent: Agent;
    onSelect: (agent: Agent) => void;
}

export function AgentResultItem({ agent, onSelect }: AgentResultItemProps) {
    const initial = (agent.name || agent.email)[0].toUpperCase();
    
    return (
        <button
            onClick={() => onSelect(agent)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent text-left transition-all group font-sans"
        >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {initial}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">{agent.name || "Unknown"}</p>
                <p className="text-[11px] text-slate-500 truncate">{agent.email}</p>
            </div>
            <div className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-bold uppercase tracking-widest group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all flex-shrink-0">
                Agent
            </div>
        </button>
    );
}
