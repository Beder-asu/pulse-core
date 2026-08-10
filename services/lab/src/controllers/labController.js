const LabOrder = require('../models/LabOrder');
const { logger } = require('@pulsecore/common');

// @desc    Create a new lab order
// @route   POST /api/lab/orders
// @access  Private (Doctor)
const createOrder = async (req, res, next) => {
  try {
    const { patientId, testName, priority, notes } = req.body;
    const doctorId = req.user.id;

    const order = await LabOrder.create({
      patientId,
      doctorId,
      testName,
      priority,
      notes
    });

    logger.info(`Lab order created: ${order._id} for patient ${patientId}`);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient lab orders
// @route   GET /api/lab/orders/patient/:patientId
// @access  Private
const getPatientOrders = async (req, res, next) => {
  try {
    // Only patient themselves or staff can view
    if (req.user.role === 'patient' && req.user.id !== req.params.patientId) {
      res.status(403);
      throw new Error('Not authorized to view these records');
    }

    const orders = await LabOrder.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
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
    const { status, result, resultFileUrl } = req.body;

    const order = await LabOrder.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Lab order not found');
    }

    order.status = status || order.status;
    order.result = result || order.result;
    order.resultFileUrl = resultFileUrl || order.resultFileUrl;

    const updatedOrder = await order.save();
    logger.info(`Lab order updated: ${order._id}`);
    
    // SSE trigger can go here eventually
    
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getPatientOrders,
  updateOrderResult
};
