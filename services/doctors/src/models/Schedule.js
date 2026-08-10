const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sunday
  startTime: { type: String, required: true },  // "09:00"
  endTime: { type: String, required: true },  // "17:00"
  slotDurationMinutes: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

scheduleSchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
