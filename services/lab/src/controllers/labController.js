const { PrismaClient } = require('@prisma/client');
const { logger } = require('@pulsecore/common');

const prisma = new PrismaClient();

// @desc    Create a new lab order
// @route   POST /api/lab/orders
// @access  Private (Doctor)
const createOrder = async (req, res, next) => {
  try {
    const { patientId, testName, priorityId, statusId, notes } = req.body;
    const doctorId = req.user.id;

    if (!patientId || !testName) {
      res.status(400);
      throw new Error('Patient and test name are required');
    }

    let activeStatusId = statusId;
    if (!activeStatusId) {
      const pendingStatus = await prisma.labStatus.findUnique({ where: { name: 'PENDING' } });
      if (!pendingStatus) throw new Error("PENDING status not found");
      activeStatusId = pendingStatus.id;
    }

    let activePriorityId = priorityId;
    if (!activePriorityId) {
      const routinePriority = await prisma.labPriority.findUnique({ where: { name: 'ROUTINE' } });
      if (!routinePriority) throw new Error("ROUTINE priority not found");
      activePriorityId = routinePriority.id;
    }

    const order = await prisma.labOrder.create({
      data: {
        patientId,
        doctorId,
        testName,
        statusId: activeStatusId,
        priorityId: activePriorityId,
        notes
      },
      include: {
        status: true,
        priority: true
      }
    });

    logger.info(`Lab order created: ${order.id} for patient ${patientId}`);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Get lab orders
// @route   GET /api/lab/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patientId) where.patientId = req.query.patientId;

    const orders = await prisma.labOrder.findMany({
      where,
      include: { status: true, priority: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient lab orders
// @route   GET /api/lab/orders/patient/:patientId
// @access  Private
const getPatientOrders = async (req, res, next) => {
  try {
    if (req.user.role === 'PATIENT' && req.user.id !== req.params.patientId) {
      res.status(403);
      throw new Error('Not authorized to view these records');
    }

    const orders = await prisma.labOrder.findMany({
      where: { patientId: req.params.patientId },
      include: { status: true, priority: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status / result
// @route   PUT /api/lab/orders/:id/result
// @access  Private (Staff/Lab Tech)
const updateOrderResult = async (req, res, next) => {
  try {
    const { statusId, result, resultFileUrl } = req.body;

    const order = await prisma.labOrder.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404);
      throw new Error('Lab order not found');
    }

    let nextStatusId = statusId || order.statusId;
    if (!statusId && result) {
      const completedStatus = await prisma.labStatus.findUnique({ where: { name: 'COMPLETED' } });
      if (completedStatus) nextStatusId = completedStatus.id;
    }

    const updatedOrder = await prisma.labOrder.update({
      where: { id: req.params.id },
      data: {
        statusId: nextStatusId,
        result: result !== undefined ? result : order.result,
        resultFileUrl: resultFileUrl !== undefined ? resultFileUrl : order.resultFileUrl
      },
      include: { status: true, priority: true }
    });

    logger.info(`Lab order updated: ${updatedOrder.id}`);
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getPatientOrders,
  updateOrderResult
};
