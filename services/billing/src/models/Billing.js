const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  totalAmount: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'cancelled'],
    default: 'draft'
  },
  items: [{
    sourceId: { type: String, required: true }, // e.g. appointmentId, labOrderId
    sourceType: { type: String, enum: ['appointment', 'lab', 'pharmacy'], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  issuedAt: { type: Date },
  paidAt: { type: Date }
}, { timestamps: true });

// Prevent duplicate processing from Kafka by storing processed event IDs
const processedEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  processedAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
const ProcessedEvent = mongoose.model('ProcessedEvent', processedEventSchema);

module.exports = { Invoice, ProcessedEvent };
