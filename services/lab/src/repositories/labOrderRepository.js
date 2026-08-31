const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const orderInclude = { status: true, priority: true };

const findStatusByName = (name) => prisma.labStatus.findUnique({ where: { name } });
const findPriorityByName = (name) => prisma.labPriority.findUnique({ where: { name } });
const create = (data) => prisma.labOrder.create({ data, include: orderInclude });
const findAll = (where = {}) => prisma.labOrder.findMany({
  where,
  include: orderInclude,
  orderBy: { createdAt: 'desc' }
});
const findById = (id) => prisma.labOrder.findUnique({ where: { id } });
const update = (id, data) => prisma.labOrder.update({ where: { id }, data, include: orderInclude });

module.exports = { findStatusByName, findPriorityByName, create, findAll, findById, update };
