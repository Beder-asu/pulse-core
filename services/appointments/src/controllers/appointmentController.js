const Appointment = require('../models/Appointment');
const { logger } = require('@pulsecore/common');

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, reasonForVisit } = req.body;
    const patientId = req.user.id;

    // Check if slot is already booked in DB (Redis lock will be added later for distributed concurrency)
    const existing = await Appointment.findOne({ doctorId, date, timeSlot, status: { $ne: 'cancelled' } });
    if (existing) {
      res.status(400);
      throw new Error('Time slot is already booked');
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      timeSlot,
      reasonForVisit
    });

    logger.info(`Appointment booked: ${appointment._id} for patient ${patientId}`);
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/my
// @access  Private
const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor appointments
// @route   GET /api/appointments/doctor/:doctorId
// @access  Private
const getDoctorAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId }).sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments
};
