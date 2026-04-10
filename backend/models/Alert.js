const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['warning', 'danger', 'info', 'critical', 'prediction']
  },
  module: {
    type: String,
    required: true,
    enum: ['traffic', 'waste', 'water', 'lighting', 'emergency', 'system', 'iot']
  },
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  zone: {
    type: String,
    enum: ['north', 'south', 'east', 'west', 'central', 'all'],
    default: 'all'
  },
  read: {
    type: Boolean,
    default: false
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true
});

alertSchema.index({ read: 1, priority: -1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ module: 1 });
alertSchema.index({ zone: 1 });

module.exports = mongoose.model('Alert', alertSchema);
