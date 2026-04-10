const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const socketUtils = require('./utils/socket');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const IoTDevice = require('./models/IoTDevice');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const trafficRoutes = require('./routes/traffic');
const wasteRoutes = require('./routes/waste');
const waterRoutes = require('./routes/water');
const lightingRoutes = require('./routes/lighting');
const incidentRoutes = require('./routes/incidents');
const alertRoutes = require('./routes/alerts');
const logRoutes = require('./routes/logs');
const complaintRoutes = require('./routes/complaints');
const chatRoutes = require('./routes/chat');
const announcementRoutes = require('./routes/announcements');
const cityHealthRoutes = require('./routes/cityHealth');
=======
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const http = require('http')
const mongoose = require('mongoose')
const socketUtils = require('./utils/socket')
const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = rateLimit
const connectDB = require('./config/db')
const errorHandler = require('./middleware/errorHandler')
const IoTDevice = require('./models/IoTDevice')

// Import routes
const authRoutes = require('./routes/auth')
const dashboardRoutes = require('./routes/dashboard')
const trafficRoutes = require('./routes/traffic')
const wasteRoutes = require('./routes/waste')
const waterRoutes = require('./routes/water')
const iotRoutes = require('./routes/iot');
const lightingRoutes = require('./routes/lighting')
const incidentRoutes = require('./routes/incidents')
// Middleware
app.use(cors());
app.use('/api', apiLimiter);
    return ipKeyGenerator(req.ip || '')
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Middleware
app.use(cors());
app.use('/api', apiLimiter);
app.use(express.json({ limit: '10mb' }));
        deviceId: 'DEV-TRAFFIC-CENTRAL-001',
        name: 'Central Traffic Junction Sensor',
        type: 'traffic-sensor',
        zone: 'central',
        location: 'MG Road Junction',
        status: 'online',
        connectionType: 'socket',
        connectionKey: 'TRAFFIC-CENTRAL-001',
        firmwareVersion: '2.1.0',
        batteryLevel: 86,
        signalStrength: 91,
        lastSeen: new Date(),
        connectedAt: new Date(),
        telemetry: {
          vehicleCount: 182,
          averageSpeed: 27,
          congestionLevel: 'medium',
        },
      },
      {
        deviceId: 'DEV-WASTE-NORTH-001',
        name: 'North Waste Fill Sensor',
        type: 'waste-sensor',
        zone: 'north',
        location: 'Sector 1 Market',
        status: 'online',
        connectionType: 'http',
        connectionKey: 'WASTE-NORTH-001',
        firmwareVersion: '1.8.2',
        batteryLevel: 72,
        signalStrength: 88,
        lastSeen: new Date(),
        connectedAt: new Date(),
        telemetry: { fillLevel: 84, fillStatus: 'full', missedPickup: true },
      },
      {
        deviceId: 'DEV-WATER-CENTRAL-001',
        name: 'Central Water Meter',
        type: 'water-meter',
        zone: 'central',
        location: 'Central Business District Pump House',
        status: 'online',
        connectionType: 'mqtt',
        connectionKey: 'WATER-CENTRAL-001',
        firmwareVersion: '3.0.4',
        batteryLevel: 94,
        signalStrength: 96,
        lastSeen: new Date(),
        connectedAt: new Date(),
        telemetry: { usage: 12096, pressure: 54, leakDetected: true },
      },
      {
        deviceId: 'DEV-LIGHT-EAST-001',
        name: 'East Lighting Controller',
        type: 'lighting-controller',
        zone: 'east',
        location: 'East Township Lane 3',
        status: 'maintenance',
        connectionType: 'socket',
        connectionKey: 'LIGHT-EAST-001',
        firmwareVersion: '1.4.7',
        batteryLevel: 61,
        signalStrength: 74,
        lastSeen: new Date(Date.now() - 15 * 60 * 1000),
        connectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        telemetry: {
          brightness: 68,
          faultDetected: true,
          faultType: 'flickering',
        },
      },
      {
        deviceId: 'DEV-AIR-WEST-001',
        name: 'West Air Quality Node',
        type: 'air-quality-sensor',
        zone: 'west',
        location: 'West Hills Monitoring Tower',
        status: 'offline',
        connectionType: 'simulation',
        connectionKey: 'AIR-WEST-001',
        firmwareVersion: '1.1.3',
        batteryLevel: 18,
        signalStrength: 52,
        lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000),
        disconnectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        telemetry: { value: 118, message: 'Battery low' },
      },
    ])

    console.log('📡 Seeded demo IoT devices')
  } catch (error) {
    console.error(`❌ IoT bootstrap failed: ${error.message}`)
  }
}

mongoose.connection.once('connected', bootstrapIoTDevices)

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/lighting', lightingRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/city-health', cityHealthRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart City API is running', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Socket.io to the HTTP Server for Real-Time Event Dispatch
const server = http.createServer(app);
socketUtils.init(server);

server.listen(PORT, () => {
  console.log(`\n🏙️  Smart City Backend running on port ${PORT} [WebSockets Supported]`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health\n`);
});
