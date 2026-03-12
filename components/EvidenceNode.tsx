import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import EvidenceCard from "./EvidenceCard";
import { useInvestigationStore } from "@/store/investigationStore";
import { X } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EvidenceNode({ id, data }: any) {
    const { deleteNode } = useInvestigationStore();
    return (
        <div className="relative group">
            <button 
                onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                className="absolute -top-2 -right-2 z-20 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
            >
                <X size={10} />
            </button>
            <EvidenceCard item={data.item} />
            <Handle type="target" position={Position.Top} className="opacity-0 w-2 h-2" />
            <Handle type="source" position={Position.Bottom} className="opacity-0 w-2 h-2" />
            <Handle type="target" position={Position.Left} className="opacity-0 w-2 h-2" />
            <Handle type="source" position={Position.Right} className="opacity-0 w-2 h-2" />
        </div>
    );
}

export default memo(EvidenceNode);
