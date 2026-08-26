const { PrismaClient } = require('@prisma/client');
const { logger } = require('@pulsecore/common');

const prisma = new PrismaClient();

// @desc    Create doctor profile
// @route   POST /api/doctors/profile
// @access  Private (Admin/Staff/Self)
const createProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, departmentId, specializationId, contactNumber } = req.body;
    const userId = req.user.id;

    if (!firstName || !lastName || !departmentId || !specializationId) {
      res.status(400);
      throw new Error('First name, last name, department, and specialization are required');
    }

    const existing = await prisma.doctorProfile.findUnique({ where: { userId } });
    if (existing) {
      res.status(400);
      throw new Error('Profile already exists');
    }

    const profile = await prisma.doctorProfile.create({
      data: {
        userId,
        firstName,
        lastName,
        departmentId,
        specializationId,
        contactNumber
      },
      include: {
        department: true,
        specialization: true
      }
    });

    logger.info(`Doctor profile created for user: ${userId}`);
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      include: {
        department: true,
        specialization: true
      }
    });
    res.json(doctors);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a doctor profile by profile id or user id
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { userId: req.params.id }
        ]
      },
      include: {
        department: true,
        specialization: true
      }
    });

    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found');
    }

    res.json(doctor);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getDoctors,
  getDoctorById
};
