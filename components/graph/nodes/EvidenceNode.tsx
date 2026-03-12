import { memo } from "react";
import EvidenceCard from "./EvidenceCard";
import { BaseNode } from "./BaseNode";

function EvidenceNode({ id, data }: any) {
    return (
        <BaseNode id={id}>
            <EvidenceCard item={data.item} />
        </BaseNode>
    );
}

export default memo(EvidenceNode);
