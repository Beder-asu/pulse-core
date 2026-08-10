const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: [
      'appointment_booked', 'appointment_cancelled',
      'lab_results_ready', 'prescription_ready',
      'medication_dispensed', 'invoice_ready'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  eventId: { type: String, required: true, unique: true },
  channel: { type: String, enum: ['in_app', 'email', 'both'], default: 'both' },
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
