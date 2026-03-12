import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = await fetch("http://localhost:8000/analyze", {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Analysis API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
