import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Find Harshad Mehta Node
    const hmNode = await prisma.node.findFirst({
      where: { label: { contains: 'Harshad Mehta' } }
    });

    if (!hmNode) {
      return NextResponse.json({ error: "Harshad Mehta node not found. Please seed the case first." }, { status: 404 });
    }

    // 2. Clear previous simulation data to avoid clutter
    await (prisma as any).locationEvent.deleteMany({
      where: { entityId: hmNode.id }
    });

    // 3. Define movement simulation (Mumbai path)
    const simulationPoints = [
      { lat: 18.9284, lng: 72.8340, loc: "BSE Towers", delayMinutes: 0 },
      { lat: 18.9322, lng: 72.8335, loc: "SBI Main Branch", delayMinutes: 60 },
      { lat: 18.9402, lng: 72.8351, loc: "Bombay High Court", delayMinutes: 180 },
      { lat: 19.0118, lng: 72.8441, loc: "Madhuli Apartments", delayMinutes: 300 },
      { lat: 19.0760, lng: 72.8777, loc: "Bandra Kurla Complex", delayMinutes: 420 },
    ];

    const baseTime = new Date('1992-04-15T09:00:00Z');

    // 4. Create location events
    for (const pt of simulationPoints) {
      const timestamp = new Date(baseTime.getTime() + pt.delayMinutes * 60000);
      await (prisma as any).locationEvent.create({
        data: {
          entityId: hmNode.id,
          latitude: pt.lat,
          longitude: pt.lng,
          timestamp: timestamp,
          source: "SIMULATED_SIGINT"
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Real-time movement simulation data injected for Harshad Mehta.",
      points: simulationPoints.length 
    });

  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
