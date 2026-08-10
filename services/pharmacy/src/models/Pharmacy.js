const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  medicineName: { type: String, required: true, unique: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true },
  supplier: { type: String },
  expiryDate: { type: Date }
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true },
  medications: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    durationDays: { type: Number, required: true }
  }],
  status: {
    type: String,
    enum: ['pending', 'dispensed', 'cancelled'],
    default: 'pending'
  },
  notes: { type: String }
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = { Inventory, Prescription };
