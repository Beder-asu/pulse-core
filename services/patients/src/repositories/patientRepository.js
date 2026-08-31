const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const findByUserId = (userId) => prisma.patientProfile.findUnique({ where: { userId } });

const create = (data) => prisma.patientProfile.create({ data });

const findAll = (where = {}) => prisma.patientProfile.findMany({
  where,
  orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
});

const findByIdOrUserId = (id) => prisma.patientProfile.findFirst({
  where: {
    OR: [{ id }, { userId: id }]
  }
});

module.exports = { findByUserId, create, findAll, findByIdOrUserId };
