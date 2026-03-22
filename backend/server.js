require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

const app = express();

// Middleware
app.use(cors());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart City API is running', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏙️  Smart City Backend running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health\n`);
});
