import { Handle, Position } from "@xyflow/react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNodeInteraction } from "@/hooks/graph/useNodeInteraction";

interface BaseNodeProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    showControls?: boolean;
}

export function BaseNode({ id, children, className, showControls = true }: BaseNodeProps) {
    const { 
        showConnectMenu, 
        handleDelete, 
        toggleConnectMenu, 
        handleConnectClick, 
        otherNodes 
    } = useNodeInteraction(id);

    return (
        <div className={cn("group relative", className)}>
            {showControls && (
                <>
                    {/* Delete Button */}
                    <button 
                        onClick={handleDelete}
                        className="absolute -top-2 -right-2 z-20 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                    >
                        <X size={10} />
                    </button>

                    {/* Connect Button */}
                    <div className="absolute -top-2 -left-2 z-20">
                        <button
                            onClick={toggleConnectMenu}
                            className="p-1.5 rounded-full bg-blue-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-lg"
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
                </>
            )}

            {children}

            {/* Standard Handles */}
            <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100" />
            <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100" />
            <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
            <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />
        </div>
    );
}
