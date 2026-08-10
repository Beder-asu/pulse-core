const mongoose = require('mongoose');

const patientHistoryViewSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  eventType: { type: String, required: true }, // e.g. 'appointment.booked', 'lab.resulted', 'invoice.finalized'
  eventId: { type: String, required: true, unique: true },
  eventData: { type: mongoose.Schema.Types.Mixed },
  serviceSource: { type: String },
  eventTimestamp: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('PatientHistoryView', patientHistoryViewSchema);
