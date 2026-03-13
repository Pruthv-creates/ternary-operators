import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    // 1. Find a subject node in the specified case (or the most risk-heavy one)
    const subjectNode = await prisma.node.findFirst({
      where: caseId ? {
        caseId,
        label: { contains: 'Mehta', mode: 'insensitive' }
      } : {
        label: { contains: 'Mehta', mode: 'insensitive' }
      }
    });

    if (!subjectNode) {
      return NextResponse.json({ error: "Subject node (Mehta) not found in this case. Please ensure the case is properly seeded." }, { status: 404 });
    }

    // 2. Clear previous simulation data for this entity
    await (prisma as any).locationEvent.deleteMany({
      where: { entityId: subjectNode.id }
    });

    // 3. Define movement simulation (Mumbai path) with conjectures
    const simulationPoints = [
      { 
        lat: 18.9284, lng: 72.8340, loc: "BSE Towers", delayMinutes: 0, 
        source: "Intelligence Intercept: Subject spotted entering the BSE. Unusual concentration of transactions detected in the 'Big Bull' accounts." 
      },
      { 
        lat: 18.9322, lng: 72.8335, loc: "SBI Main Branch", delayMinutes: 60, 
        source: "SIGINT Geo-fence: Proximity alert near SBI. Communication intercepts suggest a meeting regarding inter-bank receipts (BRs)." 
      },
      { 
        lat: 18.9402, lng: 72.8351, loc: "Bombay High Court", delayMinutes: 180, 
        source: "Surveillance Report: Subject observed meeting with legal counsel. Tension detected in gait and social interactions." 
      },
      { 
        lat: 19.0118, lng: 72.8441, loc: "Madhuli Apartments", delayMinutes: 300, 
        source: "Home Base Activity: Signal strength high at Madhuli. Multiple courier pickups noted in late hours." 
      },
      { 
        lat: 19.0760, lng: 72.8777, loc: "Bandra Kurla Complex", delayMinutes: 420, 
        source: "Strategic Movement: Arrival at BKC. Subject likely coordinating with offshore entities via sat-com link." 
      },
    ];

    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);

    // 4. Create location events
    for (const pt of simulationPoints) {
      const timestamp = new Date(baseTime.getTime() + pt.delayMinutes * 60000);
      await (prisma as any).locationEvent.create({
        data: {
          entityId: subjectNode.id,
          latitude: pt.lat,
          longitude: pt.lng,
          timestamp: timestamp,
          source: pt.source
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Geo-intelligence reconstructed for ${subjectNode.label}.`,
      points: simulationPoints.length 
    });

  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
