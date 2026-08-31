const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const appointmentInclude = { status: true };

const findStatusByName = (name) => prisma.appointmentStatus.findUnique({ where: { name } });
const findActiveSlot = ({ doctorId, date, timeSlot }) => prisma.appointment.findFirst({
  where: { doctorId, date, timeSlot },
  include: appointmentInclude
});
const create = (data) => prisma.appointment.create({ data, include: appointmentInclude });
const findAll = ({ patientId, doctorId } = {}) => {
  const where = {};
  if (patientId) where.patientId = patientId;
  if (doctorId) where.doctorId = doctorId;
  return prisma.appointment.findMany({
    where,
    include: appointmentInclude,
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }]
  });
};
const findByPatient = (patientId) => prisma.appointment.findMany({
  where: { patientId },
  include: appointmentInclude,
  orderBy: { date: 'asc' }
});
const findByDoctor = (doctorId) => prisma.appointment.findMany({
  where: { doctorId },
  include: appointmentInclude,
  orderBy: { date: 'asc' }
});

module.exports = { findStatusByName, findActiveSlot, create, findAll, findByPatient, findByDoctor };
