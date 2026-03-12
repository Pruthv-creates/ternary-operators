"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateNodePosition(nodeId: string, x: number, y: number) {
    try {
        await prisma.node.update({
            where: { id: nodeId },
            data: { 
                positionX: x,
                positionY: y
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update node position:", error);
        return { success: false };
    }
}

export async function createNewNode(caseId: string, node: any) {
    try {
        const newNode = await prisma.node.create({
            data: {
                id: node.id,
                caseId,
                type: (node.nodeType as any) || 'ENTITY_PERSON',
                label: node.data.name || node.data.label || 'New Node',
                positionX: node.position.x,
                positionY: node.position.y,
                content: JSON.stringify(node.data)
            }
        });
        return { success: true, node: newNode };
    } catch (error) {
        console.error("Failed to create node:", error);
        return { success: false };
    }
}

export async function updateNodeContent(nodeId: string, data: any) {
    try {
        await prisma.node.update({
            where: { id: nodeId },
            data: { 
                label: data.name || data.label,
                content: JSON.stringify(data)
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update node content:", error);
        return { success: false };
    }
}
