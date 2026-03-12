import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial investigation data...');

  // 1. Create a Default Case
  const demoCase = await prisma.case.upsert({
    where: { id: 'demo-nexus' },
    update: {},
    create: {
      id: 'demo-nexus',
      title: 'Project Nexus',
      description: 'Initial analysis of Orion Holdings and BlueWave money movement.',
      status: 'ACTIVE',
    },
  });

  // 2. Create the Nodes (Entities, Evidence, Hypotheses)
  // Mocking the initial nodes from investigationStore.ts
  const nodesData = [
    { id: 'volkov', type: 'ENTITY_PERSON', label: 'Alexander Volkov', positionX: 440, positionY: 150 },
    { id: 'synergy', type: 'ENTITY_ORG', label: 'Synergy Corp', positionX: 440, positionY: 400 },
    { id: 'alpha-bank', type: 'ENTITY_ORG', label: 'Alpha Bank', positionX: 740, positionY: 400 },
    { id: 'offshore', type: 'ENTITY_ORG', label: 'Offshore Entity', positionX: 440, positionY: 640 },
    { id: 'ev1', type: 'DOCUMENT', label: 'Financial Records Q4', positionX: 120, positionY: 120 },
    { id: 'hyp1', type: 'CONJECTURE', label: 'Shell company used for laundering?', positionX: 40, positionY: 650 },
  ];

  for (const n of nodesData) {
    await prisma.node.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        caseId: demoCase.id,
        type: n.type as any,
        label: n.label,
        positionX: n.positionX,
        positionY: n.positionY,
      },
    });
  }

  // 3. Create the Edges
  const edgesData = [
    { sourceId: 'volkov', targetId: 'synergy', type: 'Owner' },
    { sourceId: 'synergy', targetId: 'alpha-bank', type: 'Money Flow: $12.5M' },
    { sourceId: 'ev1', targetId: 'volkov', type: 'mentions' },
  ];

  for (const e of edgesData) {
    await prisma.edge.upsert({
      where: { 
        sourceId_targetId_relationshipType: {
          sourceId: e.sourceId,
          targetId: e.targetId,
          relationshipType: e.type
        }
      },
      update: {},
      create: {
        caseId: demoCase.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        relationshipType: e.type,
      },
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
