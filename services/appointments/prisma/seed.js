const { PrismaClient } = require('@prisma/client');
const { DEMO_IDS } = require('../../../packages/common/src/demo-data');

const prisma = new PrismaClient();

async function main() {
  const statuses = {};
  for (const [name, description] of [
    ['SCHEDULED', 'Appointment is booked and awaiting the visit'],
    ['COMPLETED', 'Visit was completed'],
    ['CANCELLED', 'Appointment was cancelled'],
    ['NO_SHOW', 'Patient did not attend'],
  ]) {
    statuses[name] = await prisma.appointmentStatus.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
  }

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  const appointments = [
    {
      id: DEMO_IDS.appointments.upcoming,
      patientId: DEMO_IDS.users.patientAmina,
      doctorId: DEMO_IDS.users.doctorOmar,
      date: tomorrow,
      timeSlot: '10:00 AM',
      statusId: statuses.SCHEDULED.id,
      reasonForVisit: 'Cardiology follow-up',
      notes: 'Review blood pressure readings and current medication.',
    },
    {
      id: DEMO_IDS.appointments.completed,
      patientId: DEMO_IDS.users.patientMariam,
      doctorId: DEMO_IDS.users.doctorSalma,
      date: yesterday,
      timeSlot: '01:30 PM',
      statusId: statuses.COMPLETED.id,
      reasonForVisit: 'Persistent fatigue',
      notes: 'CBC and thyroid panel requested.',
    },
  ];

  for (const appointment of appointments) {
    await prisma.appointment.upsert({
      where: { id: appointment.id },
      update: appointment,
      create: appointment,
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
