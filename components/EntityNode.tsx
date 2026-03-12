import { memo, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Building2, Landmark, MapPin, Globe, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvestigationStore } from "@/store/investigationStore";
import { EntityType } from "@/lib/data";

interface EntityNodeProps {
    data: {
        name: string;
        role: string;
        type: EntityType;
        selected?: boolean;
        entityId?: string;
        avatar?: string;
    };
    selected?: boolean;
}

const typeConfig: Record<
    EntityType,
    { icon: React.ReactNode; color: string; ring: string; bg: string }
> = {
    person: {
        icon: null, // use avatar
        color: "text-purple-300",
        ring: "ring-[#8b5cf6]",
        bg: "bg-[#1e293b]",
    },
    company: {
        icon: <Building2 size={24} strokeWidth={1.5} />,
        color: "text-[#3b82f6]",
        ring: "ring-[#3b82f6]",
        bg: "bg-[#0f172a]",
    },
    bank: {
        icon: <Landmark size={24} strokeWidth={1.5} />,
        color: "text-[#3b82f6]",
        ring: "ring-[#3b82f6]",
        bg: "bg-[#0f172a]",
    },
    location: {
        icon: <MapPin size={24} strokeWidth={1.5} />,
        color: "text-[#3b82f6]",
        ring: "ring-[#3b82f6]",
        bg: "bg-[#0f172a]",
    },
    offshore: {
        icon: <Globe size={24} strokeWidth={1.5} />,
        color: "text-[#3b82f6]",
        ring: "ring-[#3b82f6]",
        bg: "bg-[#0f172a]",
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EntityNode({ id, data, selected }: any) {
    const { deleteNode, nodes, onConnect } = useInvestigationStore();
    const { getNodes } = useReactFlow();
    const [showConnectMenu, setShowConnectMenu] = useState(false);
    const [connectingMode, setConnectingMode] = useState(false);
    
    const cfg = typeConfig[data.type as EntityType] ?? typeConfig.person;

    // Override color logic based on the image:
    const isPerson = data.type === "person";
    const customRing = data.name.includes("SARAM") ? "ring-teal-500" : cfg.ring;

    const handleConnectClick = (targetId: string) => {
        onConnect({
            source: id,
            target: targetId,
            sourceHandle: null,
            targetHandle: null,
        });
        setShowConnectMenu(false);
    };

    const otherNodes = getNodes().filter((n) => n.id !== id);

    return (
        <div
            className={cn(
                "group relative flex flex-col items-center gap-2.5 cursor-pointer transition-all duration-200",
                selected && "scale-105"
            )}
        >
            <button 
                onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                className="absolute -top-2 -right-2 z-20 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
                <X size={10} />
            </button>

            {/* Connect Button */}
            <div className="absolute -top-2 -left-2 z-20">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowConnectMenu(!showConnectMenu);
                    }}
                    className="p-1.5 rounded-full bg-blue-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-lg"
                    title="Connect to another entity"
                >
                    <Plus size={12} />
                </button>

                {/* Connection Menu */}
                {showConnectMenu && (
                    <div className="absolute top-8 left-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto min-w-48">
                        <div className="p-2">
                            {otherNodes.length > 0 ? (
                                otherNodes.map((node) => (
                                    <button
                                        key={node.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleConnectClick(node.id);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs rounded hover:bg-blue-700 text-slate-300 hover:text-white transition-colors"
                                    >
                                        {`→ ${node.data?.name || node.data?.label || "Node"}`}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-xs text-slate-500">
                                    No other entities
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100" />
            <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100" />
            <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
            <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />

            {/* Avatar circle */}
            <div
                className={cn(
                    "relative w-14 h-14 rounded-full flex items-center justify-center ring-[3px] transition-all duration-200 shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                    customRing,
                    cfg.bg,
                    selected ? "ring-white shadow-[0_0_20px_rgba(255,255,255,0.3)]" : ""
                )}
            >
                {/* Glow behind the icon if NOT person */}
                {!isPerson && (
                    <div className={cn("absolute inset-0 rounded-full opacity-20 bg-current blur-md", cfg.color)} />
                )}

                {/* Inner content (clipped) */}
                <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                    {isPerson && data.avatar ? (
                        <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className={cn("relative z-10", cfg.color)}>
                            {data.type === "company" ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                            ) : cfg.icon}
                        </div>
                    )}
                </div>

                {/* Risk Score badge (Top Right) */}
                {data.riskScore !== undefined && data.riskScore > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 z-20 bg-red-600 text-white text-[8px] font-black px-1 py-0.5 rounded-sm border border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                        R:{data.riskScore}%
                    </div>
                )}

                {/* Credibility Score badge (Bottom Right) */}
                {data.credibilityScore !== undefined && (
                    <div className="absolute -bottom-1.5 -right-1.5 z-20 bg-emerald-500 text-white text-[8px] font-black px-1 py-0.5 rounded-sm border border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                        C:{data.credibilityScore}%
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="text-center w-max min-w-[120px]">
                <div
                    className={cn(
                        "text-[12px] font-bold leading-tight text-center uppercase tracking-wide font-sans drop-shadow-md",
                        selected ? "text-white" : "text-white/90"
                    )}
                >
                    {data.name}
                </div>
                {data.role && (
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-medium font-sans">
                        ({data.role})
                    </div>
                )}
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _EntityNodeProps = EntityNodeProps;

export default memo(EntityNode);
