import { memo } from "react";
import HypothesisNote from "../../HypothesisNote";
import { BaseNode } from "./BaseNode";

function HypothesisNode({ id, data }: any) {
    return (
        <BaseNode id={id}>
            <HypothesisNote id={id} text={data.text} prefix={data.prefix} rotate={data.rotate} />
        </BaseNode>
    );
}

export default memo(HypothesisNode);
