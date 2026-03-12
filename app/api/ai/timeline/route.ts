import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const caseId = body.caseId;

    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }

    const res = await fetch(`http://localhost:8000/reconstruct-timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "reconstruct timeline", case_id: caseId }),
    });

    if (!res.ok) {
      throw new Error(`AI Backend returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Timeline API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
