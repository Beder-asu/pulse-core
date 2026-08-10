const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const { logger } = require('@pulsecore/common');

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new patient
// @route   POST /api/patients/register
// @access  Public
const registerPatient = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const patientExists = await Patient.findOne({ email });
    if (patientExists) {
      res.status(400);
      throw new Error('Patient already exists');
    }

    const patient = await Patient.create({
      email,
      password,
      firstName,
      lastName,
    });

    if (patient) {
      logger.info(`New patient registered: ${patient._id}`);
      res.status(201).json({
        _id: patient._id,
        email: patient.email,
        firstName: patient.firstName,
        role: patient.role,
        token: generateToken(patient._id, patient.role),
      });
    } else {
      res.status(400);
      throw new Error('Invalid patient data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/patients/login
// @access  Public
const loginPatient = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ email }).select('+password');

    if (patient && (await patient.matchPassword(password))) {
      res.json({
        _id: patient._id,
        email: patient.email,
        firstName: patient.firstName,
        role: patient.role,
        token: generateToken(patient._id, patient.role),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private
const getPatientProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (patient) {
      res.json(patient);
    } else {
      res.status(404);
      throw new Error('Patient not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerPatient,
  loginPatient,
  getPatientProfile
};
