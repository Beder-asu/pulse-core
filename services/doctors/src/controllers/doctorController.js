const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const { logger } = require('@pulsecore/common');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const registerDoctor = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, specialization, department } = req.body;

    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) {
      res.status(400);
      throw new Error('Doctor already exists');
    }

    const doctor = await Doctor.create({
      email, password, firstName, lastName, specialization, department
    });

    if (doctor) {
      logger.info(`New doctor registered: ${doctor._id}`);
      res.status(201).json({
        _id: doctor._id,
        email: doctor.email,
        firstName: doctor.firstName,
        specialization: doctor.specialization,
        role: doctor.role,
        token: generateToken(doctor._id, doctor.role),
      });
    } else {
      res.status(400);
      throw new Error('Invalid doctor data');
    }
  } catch (error) {
    next(error);
  }
};

const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email }).select('+password');

    if (doctor && (await doctor.matchPassword(password))) {
      res.json({
        _id: doctor._id,
        email: doctor.email,
        firstName: doctor.firstName,
        role: doctor.role,
        token: generateToken(doctor._id, doctor.role),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({});
    res.json(doctors);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDoctor,
  loginDoctor,
  getDoctors
};
