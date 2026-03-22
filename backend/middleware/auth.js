const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // --- OFFLINE DB BYPASS ---
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1 && decoded.isOffline) {
      req.user = {
        id: decoded.id,
        name: decoded.name || 'Offline User',
        email: decoded.email || 'offline@smartcity.com',
        role: decoded.role || 'admin',
        department: decoded.department || 'general'
      };
      return next();
    }
    // -------------------------

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

module.exports = auth;
