const { PrismaClient } = require('@prisma/client');
const { DEMO_IDS } = require('../../../packages/common/src/demo-data');

const prisma = new PrismaClient();

async function main() {
  const statuses = {};
  for (const name of ['PENDING', 'DISPENSED', 'CANCELLED']) {
    statuses[name] = await prisma.prescriptionStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const inventoryItems = [
    { medicineName: 'Amoxicillin 500mg', stockQuantity: 120, unitPrice: 8.5, supplier: 'Nile Pharma', expiryDate: new Date('2028-06-30') },
    { medicineName: 'Atorvastatin 20mg', stockQuantity: 16, unitPrice: 12.25, supplier: 'CareMed Supply', expiryDate: new Date('2028-09-30') },
    { medicineName: 'Metformin 850mg', stockQuantity: 90, unitPrice: 5.75, supplier: 'Nile Pharma', expiryDate: new Date('2029-01-31') },
    { medicineName: 'Amlodipine 5mg', stockQuantity: 64, unitPrice: 7.1, supplier: 'Delta Medical', expiryDate: new Date('2028-11-30') },
  ];

  const inventory = {};
  for (const item of inventoryItems) {
    inventory[item.medicineName] = await prisma.inventory.upsert({
      where: { medicineName: item.medicineName },
      update: item,
      create: item,
    });
  }

  const prescriptions = [
    {
      id: DEMO_IDS.prescriptions.pending,
      patientId: DEMO_IDS.users.patientAmina,
      doctorId: DEMO_IDS.users.doctorOmar,
      statusId: statuses.PENDING.id,
      notes: 'Continue after evening meal.',
      medication: {
        id: DEMO_IDS.prescriptionItems.pending,
        inventoryId: inventory['Atorvastatin 20mg'].id,
        dosage: '20 mg',
        frequency: 'Once daily',
        durationDays: 30,
      },
    },
    {
      id: DEMO_IDS.prescriptions.dispensed,
      patientId: DEMO_IDS.users.patientYoussef,
      doctorId: DEMO_IDS.users.doctorSalma,
      statusId: statuses.DISPENSED.id,
      notes: 'Completed dispensing during the visit.',
      medication: {
        id: DEMO_IDS.prescriptionItems.dispensed,
        inventoryId: inventory['Amoxicillin 500mg'].id,
        dosage: '500 mg',
        frequency: 'Three times daily',
        durationDays: 7,
      },
    },
  ];

  for (const prescription of prescriptions) {
    const { medication, ...record } = prescription;
    await prisma.prescription.upsert({
      where: { id: record.id },
      update: record,
      create: {
        ...record,
        medications: { create: medication },
      },
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
