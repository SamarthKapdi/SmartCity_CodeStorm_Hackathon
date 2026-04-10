const cron = require('node-cron')
const Complaint = require('../models/Complaint')
const IoTDevice = require('../models/IoTDevice')
const Alert = require('../models/Alert')
const { getIo } = require('./socket')

const initCronJobs = () => {
  // Every 15 minutes: Check for overdue complaints
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date()
      const result = await Complaint.updateMany(
        { deadline: { $lt: now }, status: { $ne: 'resolved' }, isOverdue: false },
        { $set: { isOverdue: true } }
      )
      if (result.modifiedCount > 0) {
        console.log(`⏰ Cron: ${result.modifiedCount} complaints marked overdue`)

        await Alert.create({
          type: 'warning',
          module: 'system',
          title: 'Overdue Complaints Detected',
          message: `${result.modifiedCount} complaint(s) have exceeded their SLA deadline.`,
          priority: 'high',
        })

        const io = getIo()
        if (io) {
          io.to('role:admin').emit('overdue_complaints', { count: result.modifiedCount })
        }
      }
    } catch (err) {
      console.error('Cron overdue check error:', err.message)
    }
  })

  // Every 10 minutes: Check device health (devices not seen in 30 min)
  cron.schedule('*/10 * * * *', async () => {
    try {
      const threshold = new Date(Date.now() - 30 * 60 * 1000) // 30 min ago
      const staleDevices = await IoTDevice.updateMany(
        { status: 'online', lastSeen: { $lt: threshold } },
        { $set: { status: 'offline', disconnectedAt: new Date() } }
      )
      if (staleDevices.modifiedCount > 0) {
        console.log(`📡 Cron: ${staleDevices.modifiedCount} devices marked offline (stale)`)

        await Alert.create({
          type: 'warning',
          module: 'iot',
          title: 'Devices Went Offline',
          message: `${staleDevices.modifiedCount} IoT device(s) haven't sent a heartbeat in 30 minutes.`,
          priority: 'medium',
        })
      }
    } catch (err) {
      console.error('Cron device health error:', err.message)
    }
  })

  // Every hour: Clean old read alerts (older than 30 days)
  cron.schedule('0 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const result = await Alert.deleteMany({ read: true, acknowledged: true, createdAt: { $lt: cutoff } })
      if (result.deletedCount > 0) {
        console.log(`🗑️ Cron: Cleaned ${result.deletedCount} old alerts`)
      }
    } catch (err) {
      console.error('Cron alert cleanup error:', err.message)
    }
  })

  console.log('⏰ Cron jobs initialized')
}

module.exports = { initCronJobs }
