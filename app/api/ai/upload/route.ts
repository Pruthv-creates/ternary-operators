import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId");

  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  let aiData;
  try {
    const aiRes = await fetch("http://localhost:8000/upload?case_id=" + caseId, {
      method: "POST",
      body: formData,
    });
    
    if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error("AI Backend upload failed:", aiRes.status, errText);
        return NextResponse.json({ error: "AI Backend upload failed" }, { status: 500 });
    }
    
    aiData = await aiRes.json();
  } catch (error: any) {
    console.error("Fetch to AI backend threw error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Save record to Postgres via Prisma for persistence and UI
  if (file && caseId) {
    try {
      await prisma.document.create({
        data: {
          title: file.name,
          fileType: file.type || "text/plain",
          caseId: caseId,
          // We don't have a storageKey yet as we're saving to local python folder,
          // but we record the fact that it exists in the case.
        },
      });
    } catch (e) {
      console.error("Failed to save document record:", e);
    }
  }

  return NextResponse.json(aiData);
}
