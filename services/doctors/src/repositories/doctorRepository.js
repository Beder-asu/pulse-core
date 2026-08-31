const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const profileInclude = { department: true, specialization: true };

const findByUserId = (userId) => prisma.doctorProfile.findUnique({ where: { userId } });

const create = (data) => prisma.doctorProfile.create({ data, include: profileInclude });

const findAll = () => prisma.doctorProfile.findMany({ include: profileInclude });

const findByIdOrUserId = (id) => prisma.doctorProfile.findFirst({
  where: { OR: [{ id }, { userId: id }] },
  include: profileInclude
});

module.exports = { findByUserId, create, findAll, findByIdOrUserId };
