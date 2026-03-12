
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Get current user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in database. Please sign up first.");
    return;
  }

  console.log(`Using user: ${user.name || user.email} (${user.id})`);

  // 2. Create the Wirecard Case
  const wirecardCase = await prisma.case.create({
    data: {
      title: "Operation Marsalek: Wirecard Collapse",
      description: "Investigation into the missing €1.9 billion from Wirecard's balance sheet and the subsequent flight of COO Jan Marsalek.",
      status: "ACTIVE",
      users: {
        connect: { id: user.id }
      }
    }
  });

  console.log(`Created case: ${wirecardCase.title} (${wirecardCase.id})`);

  // 3. Create Entities (Nodes)
  const janNode = await prisma.node.create({
    data: {
      caseId: wirecardCase.id,
      label: "Jan Marsalek",
      type: "ENTITY_PERSON",
      content: JSON.stringify({
        name: "Jan Marsalek",
        role: "Former COO, Wirecard",
        type: "person",
        status: "Fugitive",
        riskScore: 98,
        credibilityScore: 10,
        location: "Last seen Moscow, Russia",
        avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Jan_Marsalek_portrait.jpg/220px-Jan_Marsalek_portrait.jpg"
      }),
      positionX: 500,
      positionY: 200
    }
  });

  const markusNode = await prisma.node.create({
    data: {
      caseId: wirecardCase.id,
      label: "Markus Braun",
      type: "ENTITY_PERSON",
      content: JSON.stringify({
        name: "Markus Braun",
        role: "Former CEO, Wirecard",
        type: "person",
        status: "In Custody",
        riskScore: 95,
        credibilityScore: 15,
        avatar: "https://i.pravatar.cc/150?u=markusbraun"
      }),
      positionX: 300,
      positionY: 200
    }
  });

  const eyNode = await prisma.node.create({
    data: {
      caseId: wirecardCase.id,
      label: "Ernst & Young (EY)",
      type: "ENTITY_ORG",
      content: JSON.stringify({
        name: "Ernst & Young (EY)",
        role: "Auditor",
        type: "company",
        status: "Under Investigation",
        riskScore: 40,
        credibilityScore: 30
      }),
      positionX: 400,
      positionY: 400
    }
  });

  const synergyNode = await prisma.node.create({
    data: {
      caseId: wirecardCase.id,
      label: "Synergy Corp",
      type: "ENTITY_ORG",
      content: JSON.stringify({
        name: "Synergy Corp",
        role: "Third-Party Acquirer",
        type: "company",
        status: "Shell Company?",
        riskScore: 85,
        credibilityScore: 20
      }),
      positionX: 600,
      positionY: 400
    }
  });

  // 4. Create Edges
  await prisma.edge.create({
    data: {
      caseId: wirecardCase.id,
      sourceId: janNode.id,
      targetId: wirecardCase.id, // wait, target should be another node
      targetId: markusNode.id,
      relationshipType: "Collaborator"
    }
  });

  await prisma.edge.create({
    data: {
      caseId: wirecardCase.id,
      sourceId: eyNode.id,
      targetId: wirecardCase.id, // wait
      targetId: synergyNode.id,
      relationshipType: "Failed to Audit"
    }
  });

  // 5. Create Documents (Evidence)
  await prisma.document.create({
    data: {
      caseId: wirecardCase.id,
      title: "EY_Audit_Report_2019_Excerpt.pdf",
      fileType: "application/pdf",
      nodeId: eyNode.id
    }
  });

  await prisma.document.create({
    data: {
      caseId: wirecardCase.id,
      title: "Marsalek_Exit_Strategy_Comms.txt",
      fileType: "text/plain",
      nodeId: janNode.id
    }
  });

  // 6. Create News Items
  const newsItems = [
    {
      title: "Wirecard shares collapse as €1.9bn 'missing' from balance sheet",
      summary: "Financial service giant Wirecard says its auditors are unable to confirm the existence of €1.9bn in cash, roughly a quarter of its balance sheet.",
      source: "Financial Times",
      url: "https://www.ft.com/wirecard-scandal",
      sentiment: "Negative",
      publishedAt: new Date('2020-06-18T09:00:00Z')
    },
    {
      title: "Interpol issues Red Notice for Wirecard's Jan Marsalek",
      summary: "Global police agency Interpol has issued a red notice for the arrest of Jan Marsalek, the fugitive former chief operating officer of collapsed German payments firm Wirecard.",
      source: "Reuters",
      url: "https://www.reuters.com/marsalek-red-notice",
      sentiment: "Negative",
      publishedAt: new Date('2020-08-12T14:30:00Z')
    },
    {
      title: "Synergy Corp records flagged in Munich money laundering sweep",
      summary: "German prosecutors have identified Synergy Corp as a key node in the complex web of offshore entities used to facilitate Wirecard's suspicious third-party acquirer transactions.",
      source: "Spiegel International",
      url: "https://www.spiegel.de/international/business/the-wirecard-scandal-a-look-at-the-major-players-a-1234567.html",
      sentiment: "Negative",
      publishedAt: new Date('2021-02-05T11:15:00Z')
    },
    {
      title: "Whistleblower claims Jan Marsalek linked to Russian intelligence",
      summary: "New reports suggest that former Wirecard COO Jan Marsalek had long-standing ties to Russian intelligence services before his dramatics disappearance.",
      source: "Bellingcat",
      url: "https://www.bellingcat.com/news/2020/07/10/jan-marsalek-the-fugitive-coo/",
      sentiment: "Negative",
      publishedAt: new Date('2023-09-10T16:00:00Z')
    },
    {
       title: "EY Germany faces massive lawsuit over Wirecard failure",
       summary: "Thousands of investors have joined a class-action lawsuit against EY Germany, alleging the auditing firm failed to exercise professional skepticism in its Wirecard audits.",
       source: "Wall Street Journal",
       sentiment: "Negative",
       publishedAt: new Date('2024-11-20T08:00:00Z')
    },
    {
       title: "New investigation: Synergy Corp funds surfaced in Cyprus bank",
       summary: "Financial intelligence investigators in Limassol have traced €450M in transfers from Synergy Corp to previously unknown offshore accounts held in nomadic trusts.",
       source: "OCCRP",
       url: "https://www.occrp.org/en/investigations/the-wirecard-files",
       sentiment: "Negative",
       publishedAt: new Date()
    }
  ];

  for (const item of newsItems) {
    await prisma.news.create({
      data: {
        ...item,
        caseId: wirecardCase.id
      }
    });
  }

  console.log(`Successfully seeded Wirecard case with ${newsItems.length} news items.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
