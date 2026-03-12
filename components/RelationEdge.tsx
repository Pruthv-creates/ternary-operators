"use client";

import React, { useState } from "react";
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
    useReactFlow,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Edit2 } from "lucide-react";

export default function RelationEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    data,
    source,
    target,
}: EdgeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const { getNode } = useReactFlow();
    
    // Get the node labels for display
    const sourceNode = getNode(source);
    const targetNode = getNode(target);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const credibility = (data?.credibilityScore as number) || 50;

    
    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: "all",
                    }}
                    className="nodrag nopan"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className={cn(
                        "group relative px-2.5 py-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-300 max-w-[180px] cursor-pointer",
                        credibility > 80 
                            ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200" 
                            : "bg-[#0f172a]/90 border-slate-700/50 text-slate-300",
                        isHovered ? "hover:scale-110 border-blue-500/50 shadow-blue-500/20" : "hover:scale-105 hover:border-blue-500/50 hover:shadow-blue-500/10"
                    )}>
                        {/* Credibility Glow Bar */}
                        <div 
                            className={cn(
                                "absolute top-0 left-0 bottom-0 w-0.5 rounded-l-lg",
                                credibility > 80 ? "bg-emerald-500" : "bg-blue-500/50"
                            )} 
                        />
                        
                        <div className="flex flex-col gap-0.5 pl-1.5">
                            <span className="text-[10px] leading-tight font-medium tracking-tight">
                                {label}
                            </span>
                            
                            {credibility && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3].map((i) => (
                                            <div 
                                                key={i} 
                                                className={cn(
                                                    "w-1 h-1 rounded-full",
                                                    i <= (credibility / 33) ? "bg-emerald-400" : "bg-slate-700"
                                                )} 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[7px] font-black uppercase tracking-tighter opacity-50">
                                        Verified
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Edit Button - Show on hover */}
                        {isHovered && (
                            <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Dispatch custom event to parent component
                                        window.dispatchEvent(new CustomEvent("edge-edit", { detail: { edgeId: id } }));
                                    }}
                                    className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors"
                                    title="Edit relationship"
                                >
                                    <Edit2 size={14} className="text-white" />
                                </button>
                            </div>
                        )}

                        {/* Connection points for the visual "card" look */}
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-800 border border-slate-600" />
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-800 border border-slate-600" />
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
