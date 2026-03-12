const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cases = await prisma.case.findMany({
    select: { id: true, title: true, description: true }
  });
  console.log(JSON.stringify(cases, null, 2));
  await prisma.$disconnect();
}

main();
