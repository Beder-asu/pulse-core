const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  for (const name of ['PENDING', 'DISPENSED', 'CANCELLED']) {
    await prisma.prescriptionStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const inventory = [
    { medicineName: 'Amoxicillin 500mg', stockQuantity: 120, unitPrice: 8.5, supplier: 'Nile Pharma' },
    { medicineName: 'Atorvastatin 20mg', stockQuantity: 16, unitPrice: 12.25, supplier: 'CareMed Supply' },
    { medicineName: 'Metformin 850mg', stockQuantity: 90, unitPrice: 5.75, supplier: 'Nile Pharma' },
  ];

  for (const item of inventory) {
    await prisma.inventory.upsert({
      where: { medicineName: item.medicineName },
      update: item,
      create: item,
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
