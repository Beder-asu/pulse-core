const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true },
  licenseNumber: { type: String, unique: true },
  consultationFee: { type: Number, required: true, default: 50 }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
