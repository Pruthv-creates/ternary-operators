import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import EvidenceCard from "./EvidenceCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EvidenceNode({ data }: any) {
    return (
        <div className="relative">
            <EvidenceCard item={data.item} />
            <Handle type="target" position={Position.Top} className="opacity-0 w-2 h-2" />
            <Handle type="source" position={Position.Bottom} className="opacity-0 w-2 h-2" />
            <Handle type="target" position={Position.Left} className="opacity-0 w-2 h-2" />
            <Handle type="source" position={Position.Right} className="opacity-0 w-2 h-2" />
        </div>
    );
}

export default memo(EvidenceNode);
