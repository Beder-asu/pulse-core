const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true },
  testName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  result: { type: String },
  resultFileUrl: { type: String },
  notes: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('LabOrder', labOrderSchema);
