import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface PrismaError {
  code?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { caseId, sourceId, targetId, relationshipType } = await req.json();

    if (!caseId || !sourceId || !targetId || !relationshipType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const edge = await prisma.edge.create({
      data: {
        id: `${sourceId}-${targetId}-${relationshipType}-${Date.now()}`,
        caseId,
        sourceId,
        targetId,
        relationshipType,
      },
    });

    return NextResponse.json(edge, { status: 201 });
  } catch (error: unknown) {
    const err = error as PrismaError;
    console.error("Failed to create edge:", error);

    // Handle duplicate unique constraint
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Edge already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create edge" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const edgeId = searchParams.get("id");

    if (!edgeId) {
      return NextResponse.json(
        { error: "Edge ID is required" },
        { status: 400 },
      );
    }

    await prisma.edge.delete({
      where: { id: edgeId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as PrismaError;
    console.error("Failed to delete edge:", error);

    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Edge not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete edge" },
      { status: 500 },
    );
  }
}
