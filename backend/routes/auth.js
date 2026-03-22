const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();

// POST /api/auth/register — public registration defaults to 'user' role
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Public registration always creates 'user' role.  Only admin can create operator/admin via /users route.
    const user = await User.create({
      name, email, password,
      role: 'user',
      department: department || 'general'
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      action: 'User Registered',
      module: 'auth',
      details: `New citizen account created for ${user.email}`
    });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      action: 'User Login',
      module: 'auth',
      details: `${user.role} logged in`
    });

    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// ──── Admin: User Management ────

// GET /api/auth/users — list all users (admin only)
router.get('/users', auth, roleCheck('admin'), async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
});

// GET /api/auth/operators — list operators (admin only, for assignment dropdowns)
router.get('/operators', auth, roleCheck('admin'), async (req, res, next) => {
  try {
    const operators = await User.find({ role: 'operator', isActive: true }).select('name email department');
    res.json({ success: true, data: operators });
  } catch (error) { next(error); }
});

// POST /api/auth/users — admin creates operator/admin accounts
router.post('/users', auth, roleCheck('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({ name, email, password, role, department: department || 'general' });

    await ActivityLog.create({
      userId: req.user.id, userName: req.user.name,
      action: 'Created User', module: 'auth',
      details: `Admin created ${role} account: ${email}`
    });

    res.status(201).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department }
    });
  } catch (error) { next(error); }
});

module.exports = router;
