"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getCaseGraph(caseId: string) {
    const nodes = await prisma.node.findMany({
        where: { caseId },
        include: { document: true }
    });

    const edges = await prisma.edge.findMany({
        where: { caseId },
    });

    // Transform DB nodes to React Flow format
    const rfNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type.toLowerCase().includes('entity') ? 'entity' : (n.type === 'DOCUMENT' ? 'evidence' : 'hypothesis'),
        position: { x: n.positionX, y: n.positionY },
        data: { 
            name: n.label, // React Flow expects 'name' or 'label'
            label: n.label,
            type: n.type,
            content: n.content,
        },
    }));

    // Transform DB edges to React Flow format
    const rfEdges = edges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        label: e.relationshipType,
        style: { stroke: "#8b5cf6", strokeWidth: 2 },
        animated: e.relationshipType.includes('Money Flow')
    }));

    return { nodes: rfNodes, edges: rfEdges };
}
