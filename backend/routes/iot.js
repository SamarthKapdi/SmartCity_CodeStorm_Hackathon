const express = require('express')
const crypto = require('crypto')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')
const IoTDevice = require('../models/IoTDevice')
const ActivityLog = require('../models/ActivityLog')
const { getIo } = require('../utils/socket')

const router = express.Router()

const normalizeDeviceId = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const clamp = (value, min, max) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  return Math.min(max, Math.max(min, Math.round(numberValue)))
}

const pickTelemetry = (payload = {}) => {
  const telemetry = {}
  for (const field of [
    'temperature',
    'humidity',
    'pressure',
    'value',
    'load',
    'message',
  ]) {
    if (payload[field] !== undefined && payload[field] !== null) {
      telemetry[field] = payload[field]
    }
  }
  return telemetry
}

const serializeDevice = (device) => ({
  id: device._id,
  deviceId: device.deviceId,
  name: device.name,
  type: device.type,
  zone: device.zone,
  location: device.location,
  status: device.status,
  connectionType: device.connectionType,
  connectionKey: device.connectionKey,
  firmwareVersion: device.firmwareVersion,
  batteryLevel: device.batteryLevel,
  signalStrength: device.signalStrength,
  lastSeen: device.lastSeen,
  connectedAt: device.connectedAt,
  disconnectedAt: device.disconnectedAt,
  telemetry: device.telemetry,
  metadata: device.metadata,
  createdAt: device.createdAt,
  updatedAt: device.updatedAt,
})

const emitDeviceEvent = (event, device, extra = {}) => {
  const io = getIo()
  if (!io || !device) return

  const payload = {
    event,
    device: serializeDevice(device),
    timestamp: new Date().toISOString(),
    ...extra,
  }

  io.to('iot').emit('iot_device_event', payload)
  io.to(`device:${device.deviceId}`).emit('iot_device_event', payload)
}

const verifyDeviceKey = (device, payload = {}, headers = {}) => {
  const providedKey = String(
    payload.connectionKey || payload.deviceKey || headers['x-device-key'] || ''
  ).trim()
  return providedKey && providedKey === device.connectionKey
}

const buildDeviceSummary = async () => {
  const [total, online, offline, maintenance, lowBattery, byType] =
    await Promise.all([
      IoTDevice.countDocuments(),
      IoTDevice.countDocuments({ status: 'online' }),
      IoTDevice.countDocuments({ status: 'offline' }),
      IoTDevice.countDocuments({ status: 'maintenance' }),
      IoTDevice.countDocuments({ batteryLevel: { $lt: 20 } }),
      IoTDevice.aggregate([
        {
          $group: {
            _id: '$type',
            total: { $sum: 1 },
            online: {
              $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] },
            },
            offline: {
              $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ])

  return { total, online, offline, maintenance, lowBattery, byType }
}

router.get(
  '/summary',
  auth,
  roleCheck('admin', 'operator'),
  async (_req, res, next) => {
    try {
      const summary = await buildDeviceSummary()
      res.json({ success: true, data: summary })
    } catch (error) {
      next(error)
    }
  }
)

router.get(
  '/devices',
  auth,
  roleCheck('admin', 'operator'),
  async (req, res, next) => {
    try {
      const { zone, type, status } = req.query
      const filter = {}
      if (zone) filter.zone = zone
      if (type) filter.type = type
      if (status) filter.status = status

      const devices = await IoTDevice.find(filter).sort({ updatedAt: -1 })
      res.json({
        success: true,
        data: devices.map(serializeDevice),
        total: devices.length,
      })
    } catch (error) {
      next(error)
    }
  }
)

router.get(
  '/devices/:deviceId',
  auth,
  roleCheck('admin', 'operator'),
  async (req, res, next) => {
    try {
      const device = await IoTDevice.findOne({
        deviceId: normalizeDeviceId(req.params.deviceId),
      })
      if (!device) {
        return res
          .status(404)
          .json({ success: false, message: 'Device not found.' })
      }

      res.json({ success: true, data: serializeDevice(device) })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/devices/register',
  auth,
  roleCheck('admin', 'operator'),
  async (req, res, next) => {
    try {
      const name = String(req.body.name || '').trim()
      const type = String(req.body.type || 'custom')
        .trim()
        .toLowerCase()
      const zone = String(req.body.zone || '')
        .trim()
        .toLowerCase()
      const location = String(req.body.location || '').trim()
      const firmwareVersion = String(req.body.firmwareVersion || '1.0.0').trim()
      const connectionType = String(req.body.connectionType || 'socket')
        .trim()
        .toLowerCase()
      const requestedId = normalizeDeviceId(req.body.deviceId)
      const generatedId = `DEV-${Date.now().toString(36).toUpperCase()}`
      const deviceId = requestedId || generatedId
      const connectionKey = String(
        req.body.connectionKey || crypto.randomBytes(8).toString('hex')
      ).trim()

      const device = await IoTDevice.create({
        deviceId,
        name: name || deviceId,
        type,
        zone,
        location,
        firmwareVersion,
        connectionType,
        connectionKey,
        status: 'offline',
        telemetry: pickTelemetry(req.body.telemetry),
        batteryLevel: clamp(req.body.batteryLevel, 0, 100) ?? 100,
        signalStrength: clamp(req.body.signalStrength, 0, 100) ?? 100,
        metadata: req.body.metadata || {},
      })

      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.name,
        action: 'Registered IoT Device',
        module: 'iot',
        details: `Registered ${device.name} (${device.deviceId}) in ${device.zone}`,
      })

      emitDeviceEvent('device_registered', device)

      res
        .status(201)
        .json({ success: true, data: serializeDevice(device), connectionKey })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/devices/:deviceId/connect', async (req, res, next) => {
  try {
    const device = await IoTDevice.findOne({
      deviceId: normalizeDeviceId(req.params.deviceId),
    })
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: 'Device not found.' })
    }
    if (!verifyDeviceKey(device, req.body, req.headers)) {
      return res
        .status(403)
        .json({ success: false, message: 'Invalid device key.' })
    }

    device.status = 'online'
    device.connectionType = String(
      req.body.connectionType || device.connectionType || 'socket'
    )
      .trim()
      .toLowerCase()
    device.connectedAt = device.connectedAt || new Date()
    device.disconnectedAt = null
    device.lastSeen = new Date()
    device.batteryLevel =
      clamp(req.body.batteryLevel, 0, 100) ?? device.batteryLevel
    device.signalStrength =
      clamp(req.body.signalStrength, 0, 100) ?? device.signalStrength
    device.telemetry = {
      ...(device.telemetry || {}),
      ...pickTelemetry(req.body.telemetry),
      message: req.body.message || device.telemetry?.message || 'Connected',
    }
    await device.save()

    emitDeviceEvent('device_connected', device)
    if (req.body.userId && req.body.userName) {
      await ActivityLog.create({
        userId: req.body.userId,
        userName: req.body.userName,
        action: 'IoT Device Connected',
        module: 'iot',
        details: `${device.name} connected via ${device.connectionType}`,
      }).catch(() => null)
    }

    res.json({ success: true, data: serializeDevice(device) })
  } catch (error) {
    next(error)
  }
})

router.post('/devices/:deviceId/heartbeat', async (req, res, next) => {
  try {
    const device = await IoTDevice.findOne({
      deviceId: normalizeDeviceId(req.params.deviceId),
    })
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: 'Device not found.' })
    }
    if (!verifyDeviceKey(device, req.body, req.headers)) {
      return res
        .status(403)
        .json({ success: false, message: 'Invalid device key.' })
    }

    device.status = 'online'
    device.batteryLevel =
      clamp(req.body.batteryLevel, 0, 100) ?? device.batteryLevel
    device.signalStrength =
      clamp(req.body.signalStrength, 0, 100) ?? device.signalStrength
    device.telemetry = {
      ...(device.telemetry || {}),
      ...pickTelemetry(req.body.telemetry),
    }
    device.lastSeen = new Date()
    await device.save()

    emitDeviceEvent('device_heartbeat', device)
    res.json({ success: true, data: serializeDevice(device) })
  } catch (error) {
    next(error)
  }
})

router.post('/devices/:deviceId/telemetry', async (req, res, next) => {
  try {
    const device = await IoTDevice.findOne({
      deviceId: normalizeDeviceId(req.params.deviceId),
    })
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: 'Device not found.' })
    }
    if (!verifyDeviceKey(device, req.body, req.headers)) {
      return res
        .status(403)
        .json({ success: false, message: 'Invalid device key.' })
    }

    const telemetry = pickTelemetry(req.body.telemetry)
    if (req.body.batteryLevel !== undefined) {
      device.batteryLevel =
        clamp(req.body.batteryLevel, 0, 100) ?? device.batteryLevel
      telemetry.batteryLevel = device.batteryLevel
    }
    if (req.body.signalStrength !== undefined) {
      device.signalStrength =
        clamp(req.body.signalStrength, 0, 100) ?? device.signalStrength
      telemetry.signalStrength = device.signalStrength
    }

    device.telemetry = {
      ...(device.telemetry || {}),
      ...telemetry,
      message:
        req.body.message || device.telemetry?.message || 'Telemetry updated',
    }
    device.status = req.body.status || 'online'
    device.lastSeen = new Date()
    await device.save()

    emitDeviceEvent('device_telemetry', device, { telemetry: device.telemetry })
    res.json({ success: true, data: serializeDevice(device) })
  } catch (error) {
    next(error)
  }
})

router.post('/devices/:deviceId/disconnect', async (req, res, next) => {
  try {
    const device = await IoTDevice.findOne({
      deviceId: normalizeDeviceId(req.params.deviceId),
    })
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: 'Device not found.' })
    }
    if (!verifyDeviceKey(device, req.body, req.headers)) {
      return res
        .status(403)
        .json({ success: false, message: 'Invalid device key.' })
    }

    device.status = 'offline'
    device.lastSeen = new Date()
    device.disconnectedAt = new Date()
    await device.save()

    emitDeviceEvent('device_disconnected', device)

    await ActivityLog.create({
      userId: req.body.userId || null,
      userName: req.body.userName || 'IoT Device',
      action: 'IoT Device Disconnected',
      module: 'iot',
      details: `${device.name} disconnected`,
    }).catch(() => null)

    res.json({ success: true, data: serializeDevice(device) })
  } catch (error) {
    next(error)
  }
})

module.exports = router
