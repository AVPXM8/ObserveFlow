const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  serviceId: { type: String, required: true, index: true },
  logLevel: { type: String, required: true, index: true },
  message: { type: String, required: true },
  metadata: { type: Object, default: {} }
});

const alertRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['ERROR_COUNT', 'HEARTBEAT', 'DB_FAILURE'], required: true },
  threshold: { type: Number }, // e.g., 10
  windowMinutes: { type: Number }, // e.g., 1
  email: { type: String, required: true },
  active: { type: Boolean, default: true }
});

const alertSchema = new mongoose.Schema({
  ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlertRule', required: true },
  timestamp: { type: Date, default: Date.now },
  serviceId: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'RESOLVED'], default: 'ACTIVE' }
});

module.exports = {
  Log: mongoose.model('Log', logSchema),
  AlertRule: mongoose.model('AlertRule', alertRuleSchema),
  Alert: mongoose.model('Alert', alertSchema)
};
