const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g., "09:00-09:30"
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  reasonForVisit: { type: String, required: true },
  notes: { type: String },
  lockedAt: { type: Date } // Used for concurrency lock visualization/fallback
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
