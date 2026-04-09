const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketUtils = require('./utils/socket');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

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

const app = express();

// Advanced Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, 
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Middleware
app.use(cors());
app.use('/api', apiLimiter);
app.use(express.json({ limit: '10mb' }));

// Connect to database
connectDB();

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
