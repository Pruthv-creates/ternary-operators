import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch("http://localhost:8000/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: body.question,
    }),
  });

  const data = await res.json();

  return NextResponse.json(data);
}
