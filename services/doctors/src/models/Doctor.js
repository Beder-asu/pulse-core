const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, default: 'doctor' },
  contactNumber: { type: String },
  isAvailable: { type: Boolean, default: true }
}, {
  timestamps: true
});

doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

doctorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Doctor', doctorSchema);
