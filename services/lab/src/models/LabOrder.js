const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema({
  visitId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true },
  status: { type: String, enum: ['ordered', 'in_progress', 'resulted', 'cancelled'], default: 'ordered' },
  tests: [{
    testName: { type: String, required: true },
    testCode: { type: String, required: true },
    resultValue: { type: String, default: null },
    resultUnit: { type: String, default: null },
    referenceRange: { type: String, default: null },
    resultStatus: { type: String, enum: ['pending', 'completed', 'abnormal'], default: 'pending' },
    resultedAt: { type: Date, default: null },
    chargeAmount: { type: Number, required: true }
  }],
  charges: [{
    testCode: { type: String },
    description: { type: String },
    amount: { type: Number },
    idempotencyKey: { type: String }
  }],
  orderDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LabOrder', labOrderSchema);
