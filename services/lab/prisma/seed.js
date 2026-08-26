const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  for (const name of ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) {
    await prisma.labStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of ['ROUTINE', 'URGENT', 'STAT']) {
    await prisma.labPriority.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
