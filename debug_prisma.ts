
import { prisma } from './lib/prisma';
async function main() {
  console.log("PRISMA_MODELS:", Object.keys(prisma).filter(k => !k.startsWith('_')));
}
main();
