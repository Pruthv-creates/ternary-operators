import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();

  const res = await fetch("http://localhost:8000/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return NextResponse.json(data);
}
