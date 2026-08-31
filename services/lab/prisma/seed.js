const { PrismaClient } = require('@prisma/client');
const { DEMO_IDS } = require('../../../packages/common/src/demo-data');

const prisma = new PrismaClient();

async function main() {
  const statuses = {};
  for (const name of ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) {
    statuses[name] = await prisma.labStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const priorities = {};
  for (const name of ['ROUTINE', 'URGENT', 'STAT']) {
    priorities[name] = await prisma.labPriority.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const orders = [
    {
      id: DEMO_IDS.labOrders.pending,
      patientId: DEMO_IDS.users.patientAmina,
      doctorId: DEMO_IDS.users.doctorOmar,
      testName: 'Lipid Profile',
      statusId: statuses.PENDING.id,
      priorityId: priorities.ROUTINE.id,
      notes: 'Fasting sample requested.',
    },
    {
      id: DEMO_IDS.labOrders.completed,
      patientId: DEMO_IDS.users.patientMariam,
      doctorId: DEMO_IDS.users.doctorSalma,
      testName: 'Complete Blood Count',
      statusId: statuses.COMPLETED.id,
      priorityId: priorities.URGENT.id,
      result: 'Values within expected reference ranges.',
      notes: 'Reviewed by Internal Medicine.',
    },
  ];

  for (const order of orders) {
    await prisma.labOrder.upsert({
      where: { id: order.id },
      update: order,
      create: order,
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
