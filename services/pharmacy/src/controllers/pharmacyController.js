const { Inventory, Prescription } = require('../models/Pharmacy');
const { logger } = require('@pulsecore/common');

// @desc    Get all inventory
// @route   GET /api/pharmacy/inventory
// @access  Private (Staff/Admin/Doctor)
const getInventory = async (req, res, next) => {
  try {
    const items = await Inventory.find({});
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a prescription
// @route   POST /api/pharmacy/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res, next) => {
  try {
    const { patientId, medications, notes } = req.body;
    const doctorId = req.user.id;

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      medications,
      notes
    });

    logger.info(`Prescription created: ${prescription._id} by doctor ${doctorId}`);
    res.status(201).json(prescription);
  } catch (error) {
    next(error);
  }
};

// @desc    Dispense prescription
// @route   PUT /api/pharmacy/prescriptions/:id/dispense
// @access  Private (Pharmacist/Staff)
const dispensePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      res.status(404);
      throw new Error('Prescription not found');
    }

    if (prescription.status === 'dispensed') {
      res.status(400);
      throw new Error('Prescription already dispensed');
    }

    // In a real app, this should be a transaction.
    // We deduct inventory stock.
    for (const med of prescription.medications) {
      const item = await Inventory.findById(med.medicineId);
      if (item) {
        // Just a naive deduction for now
        item.stockQuantity -= (med.durationDays * 2); // naive math
        await item.save();
      }
    }

    prescription.status = 'dispensed';
    const updated = await prescription.save();
    
    logger.info(`Prescription dispensed: ${prescription._id}`);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  createPrescription,
  dispensePrescription
};
