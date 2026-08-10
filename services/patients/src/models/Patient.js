const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
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
    select: false // Don't return password by default
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, default: 'patient' },
  dateOfBirth: { type: Date },
  contactNumber: { type: String },
  address: { type: String },
  bloodGroup: { type: String }
}, {
  timestamps: true
});

// Hash password before saving
patientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
patientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Patient', patientSchema);
