const { PrismaClient } = require('@prisma/client');
const { logger } = require('@pulsecore/common');

const prisma = new PrismaClient();

// @desc    Create patient profile (Usually called via Kafka after Auth Registration)
// @route   POST /api/patients/profile
// @access  Private
const createProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth, contactNumber, address, bloodGroup } = req.body;
    const userId = req.body.userId || req.user.id;

    if (!firstName || !lastName) {
      res.status(400);
      throw new Error('First name and last name are required');
    }

    const existing = await prisma.patientProfile.findUnique({ where: { userId } });
    if (existing) {
      res.status(400);
      throw new Error('Profile already exists');
    }

    const profile = await prisma.patientProfile.create({
      data: {
        userId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        contactNumber,
        address,
        bloodGroup
      }
    });

    logger.info(`Patient profile created for user: ${userId}`);
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private
const getPatientProfile = async (req, res, next) => {
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (profile) {
      res.json(profile);
    } else {
      res.status(404);
      throw new Error('Patient profile not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patient profiles
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res, next) => {
  try {
    const patients = await prisma.patientProfile.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });
    res.json(patients);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient profile by profile id or user id
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res, next) => {
  try {
    const profile = await prisma.patientProfile.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { userId: req.params.id }
        ]
      }
    });

    if (!profile) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getPatientProfile,
  getPatients,
  getPatientById
};
