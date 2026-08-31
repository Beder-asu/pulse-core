const { PrismaClient } = require('@prisma/client');
const { DEMO_IDS } = require('../../../packages/common/src/demo-data');

const prisma = new PrismaClient();

async function main() {
  const statuses = {};
  for (const name of ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED']) {
    statuses[name] = await prisma.invoiceStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const now = new Date();
  const invoices = [
    {
      id: DEMO_IDS.invoices.issued,
      patientId: DEMO_IDS.users.patientAmina,
      totalAmount: 650,
      statusId: statuses.ISSUED.id,
      issuedAt: now,
      item: {
        id: DEMO_IDS.invoiceItems.issued,
        sourceId: DEMO_IDS.appointments.upcoming,
        sourceType: 'APPOINTMENT',
        description: 'Cardiology consultation',
        amount: 650,
      },
    },
    {
      id: DEMO_IDS.invoices.paid,
      patientId: DEMO_IDS.users.patientMariam,
      totalAmount: 280,
      statusId: statuses.PAID.id,
      issuedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      paidAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      item: {
        id: DEMO_IDS.invoiceItems.paid,
        sourceId: DEMO_IDS.labOrders.completed,
        sourceType: 'LAB',
        description: 'Complete Blood Count',
        amount: 280,
      },
    },
  ];

  for (const invoice of invoices) {
    const { item, ...record } = invoice;
    await prisma.invoice.upsert({
      where: { id: record.id },
      update: record,
      create: {
        ...record,
        items: { create: item },
      },
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
