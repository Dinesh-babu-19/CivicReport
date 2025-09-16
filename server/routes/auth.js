import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { config } from '../config.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'citizen' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({ name, email, password, role });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List admins by role (admin2 only)
router.get('/admins', authenticateToken, requireRole(['admin2']), async (req, res) => {
  try {
    const { role = 'admin1' } = req.query;
    const admins = await User.find({ role }).select('name email role zone');
    res.json({ admins: admins.map(a => ({ id: a._id, name: a.name, email: a.email, role: a.role, zone: a.zone })) });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List available zones (any authenticated user)
router.get('/zones', authenticateToken, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin1', zone: { $ne: null } }).select('name zone');
    const zones = admins.map(a => ({ zone: a.zone, adminName: a.name }));
    res.json({ zones });
  } catch (error) {
    console.error('List zones error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create an admin user (admin2 only)
router.post('/admins', authenticateToken, requireRole(['admin2']), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('zone').trim().isLength({ min: 1, max: 100 }).withMessage('Zone is required'),
  body('role').optional().isIn(['admin1']).withMessage('Role must be admin1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'admin1', zone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({ name, email, password, role, zone });
    await user.save();

    res.status(201).json({
      message: 'Admin created',
      admin: { id: user._id, name: user.name, email: user.email, role: user.role, zone: user.zone }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

