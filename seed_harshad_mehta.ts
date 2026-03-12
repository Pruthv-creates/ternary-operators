import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const caseTitle = "scam 1992";
  let targetCase = await prisma.case.findFirst({
    where: { title: { contains: caseTitle, mode: 'insensitive' } }
  });

  if (!targetCase) {
    console.log("Case not found, creating one...");
    // Just find a user to own it
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found in DB. Exiting.");
      return;
    }
    targetCase = await prisma.case.create({
      data: {
        title: "scam 1992",
        status: "ACTIVE",
        users: { connect: { id: user.id } }
      }
    });
  }

  const caseId = targetCase.id;
  console.log("Seeding data for case:", caseId);

  // Clear existing nodes for this case to avoid duplicates (optional, we'll just add new ones)
  // await prisma.node.deleteMany({ where: { caseId } });

  // 1. Entities (Nodes)
  const entityMehta = await prisma.node.create({
    data: {
      caseId,
      type: 'ENTITY_PERSON',
      label: 'Harshad Mehta',
      positionX: Math.random() * 500,
      positionY: Math.random() * 500,
      latitude: 18.9256, // Bombay Stock Exchange
      longitude: 72.8336,
      content: JSON.stringify({
        name: "Harshad Mehta",
        type: "person",
        role: "The Big Bull / Stockbroker",
        status: "Deceased",
        riskScore: 98,
        credibilityScore: 20,
        location: "Mumbai, India",
        text: "Key figure in the 1992 Indian securities scam."
      })
    }
  });

  const entitySBI = await prisma.node.create({
    data: {
      caseId,
      type: 'ENTITY_ORG',
      label: 'State Bank of India (Main Branch)',
      positionX: Math.random() * 500,
      positionY: Math.random() * 500,
      latitude: 18.9322,
      longitude: 72.8359,
      content: JSON.stringify({
        name: "State Bank of India",
        type: "organization",
        role: "Bank",
        status: "Active",
        riskScore: 60,
        location: "Mumbai, India",
        text: "Used for routing funds via fake Bank Receipts."
      })
    }
  });

  const entityNHB = await prisma.node.create({
    data: {
      caseId,
      type: 'ENTITY_ORG',
      label: 'National Housing Bank',
      positionX: Math.random() * 500,
      positionY: Math.random() * 500,
      latitude: 28.5912, // Delhi
      longitude: 77.2226,
      content: JSON.stringify({
        name: "National Housing Bank",
        type: "organization",
        role: "Bank",
        status: "Active",
        riskScore: 75,
        location: "New Delhi, India",
        text: "NHB funds were illegally diverted into Harshad Mehta's account."
      })
    }
  });

  const entityGrindlays = await prisma.node.create({
    data: {
      caseId,
      type: 'ENTITY_ORG',
      label: 'ANZ Grindlays Bank',
      positionX: Math.random() * 500,
      positionY: Math.random() * 500,
      latitude: 22.5726, // Kolkata
      longitude: 88.3639,
      content: JSON.stringify({
        name: "ANZ Grindlays Bank",
        type: "organization",
        role: "Foreign Bank",
        status: "Historical",
        riskScore: 85,
        location: "Kolkata, India",
        text: "Involved in issuing Bank Receipts without underlying securities."
      })
    }
  });

  // Edges
  await prisma.edge.create({
    data: {
      caseId,
      sourceId: entitySBI.id,
      targetId: entityMehta.id,
      relationshipType: "Funds Diverted (Fake BRs)"
    }
  });

  await prisma.edge.create({
    data: {
      caseId,
      sourceId: entityNHB.id,
      targetId: entityMehta.id,
      relationshipType: "Illegal Money Flow (500 Cr+)"
    }
  });

  await prisma.edge.create({
    data: {
      caseId,
      sourceId: entityGrindlays.id,
      targetId: entityMehta.id,
      relationshipType: "Unsecured Cheque Clearing"
    }
  });

  // Location Events for Timeline Playback
  const startDate = new Date("1991-04-01T10:00:00Z").getTime();
  const day = 24 * 60 * 60 * 1000;

  const eventsData = [
    // Harshad Mehta movements
    { entityId: entityMehta.id, lat: 18.9256, lng: 72.8336, timeOffset: 0, src: "BSE Trading Floor Log" },
    { entityId: entityMehta.id, lat: 18.9322, lng: 72.8359, timeOffset: 10 * day, src: "SBI Meeting Record" },
    { entityId: entityMehta.id, lat: 28.5912, lng: 77.2226, timeOffset: 45 * day, src: "Flight Manifest BOM-DEL (NHB Meeting)" },
    { entityId: entityMehta.id, lat: 18.9256, lng: 72.8336, timeOffset: 60 * day, src: "Massive ACC stock purchase at BSE" },
    { entityId: entityMehta.id, lat: 22.5726, lng: 88.3639, timeOffset: 90 * day, src: "Kolkata Grindlays Br. Visit" },
    { entityId: entityMehta.id, lat: 18.9256, lng: 72.8336, timeOffset: 120 * day, src: "BSE Crash - Exposure" },
    
    // Funds flow (just mapping them to the banks)
    { entityId: entitySBI.id, lat: 18.9322, lng: 72.8359, timeOffset: 12 * day, src: "Fake BR Issued" },
    { entityId: entityNHB.id, lat: 28.5912, lng: 77.2226, timeOffset: 48 * day, src: "Cheque Cleared to Broker" },
    { entityId: entityGrindlays.id, lat: 22.5726, lng: 88.3639, timeOffset: 92 * day, src: "Unsecured transaction logged" },
  ];

  for (const ev of eventsData) {
    await prisma.locationEvent.create({
      data: {
        entityId: ev.entityId,
        latitude: ev.lat,
        longitude: ev.lng,
        timestamp: new Date(startDate + ev.timeOffset),
        source: ev.src
      }
    });
  }

  console.log("Seeding complete! Added 4 entities, 3 edges, and 9 location events.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
