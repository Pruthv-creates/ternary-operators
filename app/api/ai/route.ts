import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { question } = await req.json();

        // Pointing to your LOCAL FastAPI server (uvicorn)
        // Adjust the port if yours is different (standard uvicorn is 8000)
        const response = await fetch("http://localhost:8000/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("AI Proxy Error:", error);
        return NextResponse.json(
            { answer: "Failed to connect to Local AI Backend. Check if Uvicorn is running.", sources: [] },
            { status: 500 }
        );
    }
}
