"use server";

import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "@/app/actions/case";

const prisma = new PrismaClient();

export async function updateNodePosition(nodeId: string, x: number, y: number) {
  try {
    const updatedNode = await prisma.node.update({
      where: { id: nodeId },
      data: {
        positionX: x,
        positionY: y,
      },
      include: { case: { include: { users: { take: 1 } } } },
    });

    // Log the movement if possible (using first user as a placeholder if session not passed)
    if (updatedNode.case.users[0]) {
      await createAuditLog(
        updatedNode.caseId,
        updatedNode.case.users[0].id,
        `Moved node '${updatedNode.label}' to [${Math.round(x)}, ${Math.round(y)}]`,
        "zap",
      );
    }

    return { success: true };
  } catch (error: any) {
    if (error?.code !== "P2025") {
      console.error("Failed to update node position:", error);
    }
    return { success: false };
  }
}

export async function createNewNode(caseId: string, node: any) {
  try {
    const newNode = await prisma.node.create({
      data: {
        id: node.id,
        caseId,
        type: (node.nodeType as any) || "ENTITY_PERSON",
        label: node.data.name || node.data.label || "New Node",
        positionX: node.position.x,
        positionY: node.position.y,
        content: JSON.stringify(node.data),
      },
      include: { case: { include: { users: { take: 1 } } } },
    });

    if (newNode.case.users[0]) {
      await createAuditLog(
        caseId,
        newNode.case.users[0].id,
        `Created new ${newNode.type} node: '${newNode.label}'`,
        "zap",
      );
    }

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
        content: JSON.stringify(data),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update node content:", error);
    return { success: false };
  }
}

export async function deleteNodeAction(nodeId: string, caseId: string) {
  try {
    // Delete all related edges first
    await prisma.edge.deleteMany({
      where: {
        OR: [{ sourceId: nodeId }, { targetId: nodeId }],
      },
    });

    // Delete the node
    const deletedNode = await prisma.node.delete({
      where: { id: nodeId },
      include: { case: { include: { users: { take: 1 } } } },
    });

    if (deletedNode.case.users[0]) {
      await createAuditLog(
        caseId,
        deletedNode.case.users[0].id,
        `Deleted node '${deletedNode.label}'`,
        "zap",
      );
    }

    return { success: true };
  } catch (error: any) {
    if (error?.code !== "P2025") {
      console.error("Failed to delete node:", error);
    }
    return { success: false };
  }
}

export async function createEdgeAction(
  caseId: string,
  sourceId: string,
  targetId: string,
  relationshipType: string = "related_to",
) {
  try {
    const edge = await prisma.edge.create({
      data: {
        caseId,
        sourceId,
        targetId,
        relationshipType,
      },
    });

    return {
      success: true,
      edge: {
        ...edge,
        // Return with full edge data for React Flow
        source: edge.sourceId,
        target: edge.targetId,
        type: "relation",
        label: edge.relationshipType,
      },
    };
  } catch (error: unknown) {
    const err = error as any;
    if (err?.code === "P2002") {
      return { success: false, edge: null, duplicate: true }; // Edge already exists
    }
    console.error("Failed to create edge:", error);
    return { success: false, edge: null };
  }
}

export async function updateEdgeAction(
  edgeId: string,
  relationshipType: string,
) {
  try {
    const edge = await prisma.edge.update({
      where: { id: edgeId },
      data: { relationshipType },
    });

    return {
      success: true,
      edge: {
        ...edge,
        source: edge.sourceId,
        target: edge.targetId,
        type: "relation",
        label: edge.relationshipType,
      },
    };
  } catch (error: unknown) {
    const err = error as any;
    if (err?.code === "P2025") {
      return { success: false, edge: null }; // Edge not found
    }
    console.error("Failed to update edge:", error);
    return { success: false, edge: null };
  }
}

export async function deleteEdgeAction(edgeId: string, caseId: string) {
  try {
    await prisma.edge.delete({
      where: { id: edgeId },
    });

    return { success: true };
  } catch (error: unknown) {
    const err = error as any;
    if (err?.code === "P2025") {
      return { success: true }; // Already deleted
    }
    console.error("Failed to delete edge:", error);
    return { success: false };
  }
}
