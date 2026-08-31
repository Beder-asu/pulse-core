const labOrderService = require('../services/labOrderService');

const forwardError = (error, res, next) => {
  if (error.statusCode) res.status(error.statusCode);
  next(error);
};

// @desc    Create a new lab order
// @route   POST /api/lab/orders
// @access  Private (Doctor)
const createOrder = async (req, res, next) => {
  try {
    const doctorId = req.body.doctorId || req.user.id;
    const order = await labOrderService.createOrder({ ...req.body, requester: req.user, doctorId });
    res.status(201).json(order);
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get lab orders
// @route   GET /api/lab/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    res.json(await labOrderService.getOrders({ requester: req.user, filters: req.query }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get patient lab orders
// @route   GET /api/lab/orders/patient/:patientId
// @access  Private
const getPatientOrders = async (req, res, next) => {
  try {
    res.json(await labOrderService.getPatientOrders({ requester: req.user, patientId: req.params.patientId }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Update order status / result
// @route   PUT /api/lab/orders/:id/result
// @access  Private (Staff/Lab Tech)
const updateOrderResult = async (req, res, next) => {
  try {
    const updatedOrder = await labOrderService.updateOrderResult({ id: req.params.id, ...req.body });
    res.json(updatedOrder);
  } catch (error) {
    forwardError(error, res, next);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getPatientOrders,
  updateOrderResult
};
