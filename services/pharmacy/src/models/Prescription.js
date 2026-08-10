const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  visitId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true },
  status: { type: String, enum: ['issued', 'dispensed', 'cancelled'], default: 'issued' },
  items: [{
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String },
    quantity: { type: Number, required: true }
  }],
  prescribedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
