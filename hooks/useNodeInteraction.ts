import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useInvestigationStore } from "@/store/investigationStore";

export function useNodeInteraction(id: string) {
    const { deleteNode, onConnect } = useInvestigationStore();
    const { getNodes } = useReactFlow();
    const [showConnectMenu, setShowConnectMenu] = useState(false);

    const handleConnectClick = (targetId: string) => {
        onConnect({
            source: id,
            target: targetId,
            sourceHandle: null,
            targetHandle: null,
        });
        setShowConnectMenu(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNode(id);
    };

    const toggleConnectMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowConnectMenu(!showConnectMenu);
    };

    const otherNodes = getNodes().filter((n) => n.id !== id);

    return {
        showConnectMenu,
        setShowConnectMenu,
        handleConnectClick,
        handleDelete,
        toggleConnectMenu,
        otherNodes
    };
}
