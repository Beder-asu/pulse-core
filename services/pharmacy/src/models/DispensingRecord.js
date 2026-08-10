const mongoose = require('mongoose');

const dispensingRecordSchema = new mongoose.Schema({
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  visitId: { type: String, required: true },
  patientId: { type: String, required: true },
  items: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: { type: String },
    quantityDispensed: { type: Number, required: true },
    unitPrice: { type: Number },
    totalPrice: { type: Number }
  }],
  idempotencyKey: { type: String, required: true, unique: true },
  dispensedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DispensingRecord', dispensingRecordSchema);
