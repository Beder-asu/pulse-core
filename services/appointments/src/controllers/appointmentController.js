const appointmentService = require('../services/appointmentService');

const forwardError = (error, res, next) => {
  if (error.statusCode) res.status(error.statusCode);
  next(error);
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res, next) => {
  try {
    const patientId = req.body.patientId || req.user.id;
    const appointment = await appointmentService.bookAppointment({
      ...req.body,
      requester: req.user,
      patientId,
      authHeader: req.headers.authorization
    });
    res.status(201).json(appointment);
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get appointments with optional patientId/doctorId filters
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    res.json(await appointmentService.getAppointments({ requester: req.user, filters: req.query }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/my
// @access  Private
const getMyAppointments = async (req, res, next) => {
  try {
    res.json(await appointmentService.getPatientAppointments({ requester: req.user, patientId: req.user.id }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get doctor appointments
// @route   GET /api/appointments/doctor/:doctorId
// @access  Private
const getDoctorAppointments = async (req, res, next) => {
  try {
    res.json(await appointmentService.getDoctorAppointments({ requester: req.user, doctorId: req.params.doctorId }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  getMyAppointments,
  getDoctorAppointments
};
