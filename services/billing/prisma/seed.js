const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  for (const name of ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED']) {
    await prisma.invoiceStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
