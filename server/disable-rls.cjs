const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "ParentCandidateLink" DISABLE ROW LEVEL SECURITY;`);
  console.log("RLS disabled for ParentCandidateLink");
}
main().catch(console.error).finally(() => prisma.$disconnect());
