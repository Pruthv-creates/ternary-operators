import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import HypothesisNote from "./HypothesisNote";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HypothesisNode({ id, data }: any) {
    return (
        <div className="relative">
            <HypothesisNote id={id} text={data.text} prefix={data.prefix} rotate={data.rotate} />
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <Handle type="target" position={Position.Left} className="opacity-0" />
            <Handle type="source" position={Position.Right} className="opacity-0" />
        </div>
    );
}

export default memo(HypothesisNode);
