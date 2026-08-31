const inventoryService = require('../services/inventoryService');
const prescriptionService = require('../services/prescriptionService');
const dispensingService = require('../services/dispensingService');

const forwardError = (error, res, next) => {
  if (error.statusCode) res.status(error.statusCode);
  next(error);
};

// @desc    Get all inventory
// @route   GET /api/pharmacy/inventory
// @access  Private
const getInventory = async (req, res, next) => {
  try {
    res.json(await inventoryService.getInventory(req.user));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get prescriptions
// @route   GET /api/pharmacy/prescriptions
// @access  Private
const getPrescriptions = async (req, res, next) => {
  try {
    res.json(await prescriptionService.getPrescriptions({ requester: req.user, patientId: req.query.patientId }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Create a prescription
// @route   POST /api/pharmacy/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res, next) => {
  try {
    const doctorId = req.body.doctorId || req.user.id;
    const prescription = await prescriptionService.createPrescription({ ...req.body, requester: req.user, doctorId });
    res.status(201).json(prescription);
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Dispense prescription
// @route   PUT /api/pharmacy/prescriptions/:id/dispense
// @access  Private (Pharmacist/Staff)
const dispensePrescription = async (req, res, next) => {
  try {
    res.json(await dispensingService.dispense({ requester: req.user, id: req.params.id }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

module.exports = {
  getInventory,
  getPrescriptions,
  createPrescription,
  dispensePrescription
};
