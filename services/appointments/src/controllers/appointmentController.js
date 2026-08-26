const { PrismaClient } = require('@prisma/client');
const { logger, kafka } = require('@pulsecore/common');
const crypto = require('crypto');

const prisma = new PrismaClient();

const verifyDoctorExists = async (doctorId, authHeader) => {
  const doctorsServiceUrl = process.env.DOCTORS_SERVICE_URL;

  if (!doctorsServiceUrl) {
    return true;
  }

  const response = await fetch(`${doctorsServiceUrl.replace(/\/$/, '')}/api/doctors/${encodeURIComponent(doctorId)}`, {
    headers: authHeader ? { Authorization: authHeader, 'X-Internal-Call': 'true' } : { 'X-Internal-Call': 'true' }
  });

  return response.ok;
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, reasonForVisit, statusId, patientId: bodyPatientId } = req.body;
    // Allow patientId to come from the form (for dev/staff booking on behalf of patients)
    // Fallback to the authenticated user's ID
    const patientId = bodyPatientId || req.user.id;

    if (!patientId || !doctorId || !date || !timeSlot || !reasonForVisit) {
      res.status(400);
      throw new Error('Patient, doctor, date, time slot, and reason are required');
    }

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      res.status(400);
      throw new Error('Appointment date is invalid');
    }

    const doctorExists = await verifyDoctorExists(doctorId, req.headers.authorization);
    if (!doctorExists) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    // Prevent obvious double-booking by checking the active slot before creating.
    let activeStatusId = statusId;
    if (!activeStatusId) {
      const scheduledStatus = await prisma.appointmentStatus.findUnique({ where: { name: 'SCHEDULED' } });
      if (!scheduledStatus) throw new Error("SCHEDULED status not found in dynamic enum table");
      activeStatusId = scheduledStatus.id;
    }

    // Since we query by 'not cancelled', we'd normally need the CANCELLED status ID.
    // For simplicity, we just check if any appointment exists at that slot for that doctor.
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: appointmentDate,
        timeSlot
      },
      include: { status: true }
    });

    if (existing && existing.status.name !== 'CANCELLED') {
      res.status(400);
      throw new Error('Time slot is already booked');
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: appointmentDate,
        timeSlot,
        statusId: activeStatusId,
        reasonForVisit
      },
      include: {
        status: true
      }
    });

    try {
      await kafka.publish('hospital.events', {
        eventId: crypto.randomUUID(),
        event: 'AppointmentCreated',
        payload: {
          appointmentId: appointment.id,
          patientId,
          doctorId,
          date,
          timeSlot
        }
      });
    } catch (eventError) {
      if (process.env.KAFKA_REQUIRED === 'true') {
        throw eventError;
      }
      logger.warn('Appointment created, but Kafka event publishing failed', { error: eventError.message });
    }

    logger.info(`Appointment booked: ${appointment.id} for patient ${patientId}`);
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments with optional patientId/doctorId filters
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.doctorId) where.doctorId = req.query.doctorId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: { status: true },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }]
    });

    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/my
// @access  Private
const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.user.id },
      include: { status: true },
      orderBy: { date: 'asc' }
    });
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
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.params.doctorId },
      include: { status: true },
      orderBy: { date: 'asc' }
    });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  getMyAppointments,
  getDoctorAppointments
};
