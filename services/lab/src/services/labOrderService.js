const { logger } = require('@pulsecore/common');
const labOrderRepository = require('../repositories/labOrderRepository');
const { validateNewOrder, validateOrderFilters } = require('../validators/labOrderValidator');
const { createServiceError } = require('../errors/serviceError');
const labAccessPolicy = require('../policies/labAccessPolicy');

const createLabOrderService = ({ orders, access, serviceLogger }) => ({
  createOrder: async ({ requester, patientId, doctorId, testName, priority, priorityId, statusId, notes }) => {
    access.assertCanCreate(requester, doctorId);
    validateNewOrder({ patientId, testName, priority });

    let activeStatusId = statusId;
    if (!activeStatusId) {
      const pendingStatus = await orders.findStatusByName('PENDING');
      if (!pendingStatus) throw new Error('PENDING status not found');
      activeStatusId = pendingStatus.id;
    }

    let activePriorityId = priorityId;
    if (!activePriorityId) {
      const routinePriority = await orders.findPriorityByName('ROUTINE');
      if (!routinePriority) throw new Error('ROUTINE priority not found');
      activePriorityId = routinePriority.id;
    }

    const order = await orders.create({
      patientId,
      doctorId,
      testName,
      statusId: activeStatusId,
      priorityId: activePriorityId,
      notes
    });
    serviceLogger.info(`Lab order created: ${order.id} for patient ${patientId}`);
    return order;
  },

  getOrders: ({ requester, filters }) => {
    const validatedFilters = validateOrderFilters(filters);
    return orders.findAll(access.listScope(requester, validatedFilters));
  },

  getPatientOrders: ({ requester, patientId }) => {
    access.assertCanReadPatient(requester, patientId);
    return orders.findAll({ patientId });
  },

  updateOrderResult: async ({ id, statusId, result, resultFileUrl }) => {
    const order = await orders.findById(id);
    if (!order) throw createServiceError('Lab order not found', 404);

    let nextStatusId = statusId || order.statusId;
    if (!statusId && result) {
      const completedStatus = await orders.findStatusByName('COMPLETED');
      if (completedStatus) nextStatusId = completedStatus.id;
    }

    const updatedOrder = await orders.update(id, {
      statusId: nextStatusId,
      result: result !== undefined ? result : order.result,
      resultFileUrl: resultFileUrl !== undefined ? resultFileUrl : order.resultFileUrl
    });
    serviceLogger.info(`Lab order updated: ${updatedOrder.id}`);
    return updatedOrder;
  }
});

module.exports = createLabOrderService({ orders: labOrderRepository, access: labAccessPolicy, serviceLogger: logger });
module.exports.createLabOrderService = createLabOrderService;
