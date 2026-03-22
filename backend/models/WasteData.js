const mongoose = require('mongoose');

const wasteDataSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: [true, 'Bin ID is required'],
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  zone: {
    type: String,
    required: true,
    enum: ['north', 'south', 'east', 'west', 'central']
  },
  fillLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  fillStatus: {
    type: String,
    enum: ['empty', 'half', 'full'],
    default: 'empty'
  },
  wasteType: {
    type: String,
    enum: ['general', 'recyclable', 'organic', 'hazardous'],
    default: 'general'
  },
  collectionStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'in-progress', 'completed', 'missed'],
    default: 'pending'
  },
  lastCollected: {
    type: Date,
    default: null
  },
  nextCollection: {
    type: Date,
    default: null
  },
  routeId: {
    type: String,
    default: null
  },
  missedPickup: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-compute fill status from fill level
wasteDataSchema.pre('save', function(next) {
  if (this.fillLevel <= 30) this.fillStatus = 'empty';
  else if (this.fillLevel <= 70) this.fillStatus = 'half';
  else this.fillStatus = 'full';
  next();
});

wasteDataSchema.index({ zone: 1, fillStatus: 1 });

module.exports = mongoose.model('WasteData', wasteDataSchema);
