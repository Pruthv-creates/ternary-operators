import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useInvestigationStore } from "@/store/investigationStore";
import { entities, Entity, EntityType } from "@/lib/data";

export function useCanvasSearch() {
    const { nodes, setSelectedEntity } = useInvestigationStore();
    const { setCenter } = useReactFlow();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) return;
        
        const match = nodes.find(n => 
            (n.data.name as string)?.toLowerCase().includes(query.toLowerCase()) ||
            (n.data.label as string)?.toLowerCase().includes(query.toLowerCase())
        );
        
        if (match) {
            const entity = entities.find(e => e.id === match.id) || {
                id: match.id,
                name: (match.data.name || match.data.label) as string,
                role: match.data.role as string,
                type: (match.data.type || "person") as EntityType,
                avatar: (match.data as any).avatar,
                status: (match.data as any).status,
                credibilityScore: (match.data as any).credibilityScore,
                riskScore: (match.data as any).riskScore,
            };
            setSelectedEntity(entity as Entity);
            
            // Pan to node
            setCenter(match.position.x, match.position.y, { zoom: 1.2, duration: 800 });
        }
    };

    return {
        searchQuery,
        setSearchQuery,
        isSearching,
        setIsSearching,
        handleSearch
    };
}
