import { NextRequest, NextResponse } from "next/server";

const BACKEND_AI_URL = process.env.BACKEND_AI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const { entity1, entity2, context } = await request.json();

    if (!entity1 || !entity2) {
      return NextResponse.json(
        { error: "Missing entity1 or entity2" },
        { status: 400 }
      );
    }

    // Call the backend-ai service
    const response = await fetch(`${BACKEND_AI_URL}/generate-relation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entity1,
        entity2,
        context: context || "",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Backend-AI error:", error);
      return NextResponse.json(
        { error: "Failed to generate relation" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating relation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
