const { PrismaClient } = require('@prisma/client');
const { logger } = require('@pulsecore/common');

const prisma = new PrismaClient();

// @desc    Get all inventory
// @route   GET /api/pharmacy/inventory
// @access  Private
const getInventory = async (req, res, next) => {
  try {
    const items = await prisma.inventory.findMany();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions
// @route   GET /api/pharmacy/prescriptions
// @access  Private
const getPrescriptions = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patientId) where.patientId = req.query.patientId;

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        status: true,
        medications: { include: { inventory: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(prescriptions);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a prescription
// @route   POST /api/pharmacy/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res, next) => {
  try {
    const { patientId, medications, notes, statusId } = req.body;
    const doctorId = req.user.id;

    if (!patientId || !Array.isArray(medications) || medications.length === 0) {
      res.status(400);
      throw new Error('Patient and at least one medication are required');
    }

    for (const med of medications) {
      if (!med.medicineId || !med.dosage || !med.frequency || !Number.isInteger(Number(med.durationDays)) || Number(med.durationDays) <= 0) {
        res.status(400);
        throw new Error('Each medication requires medicineId, dosage, frequency, and a positive durationDays value');
      }
    }

    let activeStatusId = statusId;
    if (!activeStatusId) {
      const pendingStatus = await prisma.prescriptionStatus.findUnique({ where: { name: 'PENDING' } });
      if (!pendingStatus) throw new Error("PENDING status not found");
      activeStatusId = pendingStatus.id;
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        notes,
        statusId: activeStatusId,
        medications: {
          create: medications.map(med => ({
            inventoryId: med.medicineId, // mapping from front-end request
            dosage: med.dosage,
            frequency: med.frequency,
            durationDays: med.durationDays
          }))
        }
      },
      include: {
        status: true,
        medications: { include: { inventory: true } }
      }
    });

    logger.info(`Prescription created: ${prescription.id} by doctor ${doctorId}`);
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
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: { status: true, medications: true }
    });

    if (!prescription) {
      res.status(404);
      throw new Error('Prescription not found');
    }

    if (prescription.status.name === 'DISPENSED') {
      res.status(400);
      throw new Error('Prescription already dispensed');
    }

    const dispensedStatus = await prisma.prescriptionStatus.findUnique({ where: { name: 'DISPENSED' } });
    if (!dispensedStatus) throw new Error("DISPENSED status not found");

    const updated = await prisma.$transaction(async (tx) => {
      for (const med of prescription.medications) {
        const requestedUnits = med.durationDays;
        const decremented = await tx.inventory.updateMany({
          where: {
            id: med.inventoryId,
            stockQuantity: { gte: requestedUnits }
          },
          data: {
            stockQuantity: { decrement: requestedUnits }
          }
        });

        if (decremented.count !== 1) {
          const item = await tx.inventory.findUnique({ where: { id: med.inventoryId } });
          throw new Error(`Insufficient stock for ${item?.medicineName || 'prescribed medication'}`);
        }
      }

      return await tx.prescription.update({
        where: { id: req.params.id },
        data: { statusId: dispensedStatus.id },
        include: { status: true, medications: { include: { inventory: true } } }
      });
    });

    logger.info(`Prescription dispensed: ${prescription.id}`);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getPrescriptions,
  createPrescription,
  dispensePrescription
};
