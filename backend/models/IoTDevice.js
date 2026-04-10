const mongoose = require('mongoose')

const telemetrySchema = new mongoose.Schema(
  {
    temperature: { type: Number, default: null },
    humidity: { type: Number, default: null },
    pressure: { type: Number, default: null },
    value: { type: Number, default: null },
    load: { type: Number, default: null },
    batteryLevel: { type: Number, default: null },
    signalStrength: { type: Number, default: null },
    message: { type: String, default: '' },
  },
  { _id: false }
)

const iotDeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'traffic-sensor',
        'waste-sensor',
        'water-meter',
        'lighting-controller',
        'air-quality-sensor',
        'custom',
      ],
      default: 'custom',
    },
    zone: {
      type: String,
      required: true,
      enum: ['north', 'south', 'east', 'west', 'central'],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['offline', 'connecting', 'online', 'error', 'maintenance'],
      default: 'offline',
    },
    connectionType: {
      type: String,
      enum: ['socket', 'http', 'mqtt', 'simulation'],
      default: 'socket',
    },
    connectionKey: {
      type: String,
      required: true,
      trim: true,
    },
    firmwareVersion: {
      type: String,
      default: '1.0.0',
      trim: true,
    },
    batteryLevel: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    signalStrength: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    disconnectedAt: {
      type: Date,
      default: null,
    },
    telemetry: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

iotDeviceSchema.index({ zone: 1, status: 1 })
iotDeviceSchema.index({ type: 1, status: 1 })
iotDeviceSchema.index({ lastSeen: -1 })

module.exports = mongoose.model('IoTDevice', iotDeviceSchema)
