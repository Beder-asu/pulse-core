const mongoose = require('mongoose');

const processedEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  processedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProcessedEvent', processedEventSchema);
