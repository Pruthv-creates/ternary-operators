import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface PrismaError {
  code?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { caseId, nodeId, data } = await req.json();

    if (!caseId || !nodeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const updatedNode = await prisma.node.update({
      where: { id: nodeId },
      data: {
        label: data.label || data.name,
        content: JSON.stringify(data),
        positionX: data.position?.x ?? undefined,
        positionY: data.position?.y ?? undefined,
      },
    });

    return NextResponse.json(updatedNode, { status: 200 });
  } catch (error: unknown) {
    const err = error as PrismaError;
    console.error("Failed to update node:", error);

    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update node" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get("id");

    if (!nodeId) {
      return NextResponse.json(
        { error: "Node ID is required" },
        { status: 400 },
      );
    }

    // Delete all related edges first
    await prisma.edge.deleteMany({
      where: {
        OR: [{ sourceId: nodeId }, { targetId: nodeId }],
      },
    });

    // Delete the node
    await prisma.node.delete({
      where: { id: nodeId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as PrismaError;
    console.error("Failed to delete node:", error);

    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete node" },
      { status: 500 },
    );
  }
}
