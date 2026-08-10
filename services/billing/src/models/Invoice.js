const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  visitId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  status: { type: String, enum: ['provisional', 'final', 'paid', 'cancelled'], default: 'provisional' },
  items: [{
    sourceService: { type: String, enum: ['lab', 'pharmacy', 'appointments'] },
    sourceId: { type: String },
    description: { type: String },
    amount: { type: Number },
    idempotencyKey: { type: String, required: true }
  }],
  totalAmount: { type: Number, default: 0 },
  visitCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  finalizedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
