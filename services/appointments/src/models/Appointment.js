const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true, index: true },
  visitId: { type: String, default: null, index: true },
  appointmentDate: { type: Date, required: true },
  startTime: { type: String, required: true },  // "09:00"
  endTime: { type: String, required: true },  // "09:30"
  status: {
    type: String,
    enum: ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  reason: { type: String },
  notes: { type: String },
  consultationFee: { type: Number }
}, { timestamps: true });

// Partial unique index to prevent double booking the same slot unless cancelled
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
