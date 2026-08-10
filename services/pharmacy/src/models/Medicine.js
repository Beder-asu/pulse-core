const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unitPrice: { type: Number, required: true },
  stockQuantity: { type: Number, required: true, min: 0 },
  reorderLevel: { type: Number, default: 10 },
  category: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
