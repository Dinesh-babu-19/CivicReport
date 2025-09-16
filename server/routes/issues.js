import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Issue from '../models/Issue.js';
import IssueUpdate from '../models/IssueUpdate.js';
import Notification from '../models/Notification.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import User from '../models/User.js';

const router = express.Router();

// Submit new issue (Citizen only)
router.post('/', authenticateToken, requireRole(['citizen']), upload.single('photo'), [
  body('category').isIn(['Infrastructure', 'Environment', 'Safety', 'Transportation', 'Utilities', 'Other']).withMessage('Valid category required'),
  body('zone').trim().isLength({ min: 1, max: 100 }).withMessage('Zone required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, zone, description, latitude, longitude, address = '', priority = 'medium' } = req.body;

    // Create issue
    const issue = new Issue({
      citizen: req.user._id,
      category,
      description,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address
      },
      priority,
      zone,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null
    });

    await issue.save();

    // Create initial status update
    const issueUpdate = new IssueUpdate({
      issue: issue._id,
      updatedBy: req.user._id,
      status: 'pending',
      comment: 'Issue submitted'
    });

    await issueUpdate.save();

    // Create notification
    const notification = new Notification({
      user: req.user._id,
      issue: issue._id,
      message: `Your ${category.toLowerCase()} issue has been submitted successfully.`,
      type: 'status_update'
    });

    await notification.save();

    res.status(201).json({
      message: 'Issue submitted successfully',
      issue: {
        id: issue._id,
        category: issue.category,
        description: issue.description,
        status: issue.status,
        location: issue.location,
        photoUrl: issue.photoUrl,
        createdAt: issue.createdAt
      }
    });
  } catch (error) {
    console.error('Issue submission error:', error);
    res.status(500).json({ message: 'Server error during issue submission' });
  }
});

// Get all issues with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, status, location, page = 1, limit = 20, assignedTo } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (req.user.role === 'admin1' && req.user.zone) filter.zone = req.user.zone;
    
    // Location filter (within radius)
    if (location) {
      const [lat, lng, radius = 10] = location.split(',').map(Number);
      filter['location.latitude'] = {
        $gte: lat - radius/111, // Rough conversion: 1 degree ≈ 111 km
        $lte: lat + radius/111
      };
      filter['location.longitude'] = {
        $gte: lng - radius/111,
        $lte: lng + radius/111
      };
    }

    const issues = await Issue.find(filter)
      .populate('citizen', 'name email')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Issue.countDocuments(filter);

    res.json({
      issues,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get issue by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('citizen', 'name email')
      .populate('assignedTo', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Get issue updates
    const updates = await IssueUpdate.find({ issue: issue._id })
      .populate('updatedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      issue,
      updates
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's own issues
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user is accessing their own issues or is admin
    if (req.params.userId !== req.user._id.toString() && !['admin1', 'admin2'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const issues = await Issue.find({ citizen: req.params.userId })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    res.json({ issues });
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update issue status (Admin only)
router.patch('/:id/status', authenticateToken, requireRole(['admin1', 'admin2']), [
  body('status').isIn(['pending', 'acknowledged', 'in_progress', 'awaiting_confirmation', 'resolved']).withMessage('Valid status required'),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, comment = '' } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update issue status
    issue.status = status;
    // Reset confirmation unless confirmed by citizen
    if (status !== 'resolved') {
      issue.resolutionConfirmed = false;
    }
    await issue.save();

    // Create status update record
    const issueUpdate = new IssueUpdate({
      issue: issue._id,
      updatedBy: req.user._id,
      status,
      comment
    });

    await issueUpdate.save();

    // Create notification for citizen
    let message = `Your ${issue.category.toLowerCase()} issue status has been updated to ${status.replace('_', ' ')}.`;
    if (status === 'awaiting_confirmation') {
      message = `Issue work completed. Please confirm if the issue is truly solved.`;
    }
    const notification = new Notification({
      user: issue.citizen,
      issue: issue._id,
      message,
      type: 'status_update'
    });
    await notification.save();

    res.json({
      message: 'Issue status updated successfully',
      issue: {
        id: issue._id,
        status: issue.status,
        resolutionConfirmed: issue.resolutionConfirmed
      }
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark own issue as resolved (Citizen only)
router.patch('/:id/resolve', authenticateToken, requireRole(['citizen']), async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Ensure the logged-in citizen owns this issue
    if (issue.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only resolve your own issues' });
    }

    // If already resolved, return current state
    if (issue.status === 'resolved') {
      return res.json({
        message: 'Issue already resolved',
        issue: { id: issue._id, status: issue.status }
      });
    }

    issue.status = 'resolved';
    issue.resolutionConfirmed = true;
    await issue.save();

    const issueUpdate = new IssueUpdate({
      issue: issue._id,
      updatedBy: req.user._id,
      status: 'resolved',
      comment: 'Marked resolved by reporter'
    });
    await issueUpdate.save();

    // Notify admins (optional): here we notify the reporter for consistency; in a real app we'd notify admins/team
    const notification = new Notification({
      user: issue.citizen,
      issue: issue._id,
      message: `You confirmed the issue as resolved. Thank you!`,
      type: 'status_update'
    });
    await notification.save();

    res.json({
      message: 'Issue marked as resolved',
      issue: { id: issue._id, status: issue.status, resolutionConfirmed: issue.resolutionConfirmed }
    });
  } catch (error) {
    console.error('Resolve own issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Citizen confirms resolution after admin marks resolved
router.patch('/:id/confirm-resolution', authenticateToken, requireRole(['citizen']), async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    if (issue.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only confirm your own issues' });
    }
    if (!['awaiting_confirmation', 'resolved'].includes(issue.status)) {
      return res.status(400).json({ message: 'Issue is not awaiting confirmation' });
    }

    issue.resolutionConfirmed = true;
    issue.status = 'resolved';
    await issue.save();

    const issueUpdate = new IssueUpdate({
      issue: issue._id,
      updatedBy: req.user._id,
      status: 'resolved',
      comment: 'Resolution confirmed by citizen'
    });
    await issueUpdate.save();

    const notification = new Notification({
      user: issue.citizen,
      issue: issue._id,
      message: 'Thanks for confirming the resolution.',
      type: 'status_update'
    });
    await notification.save();

    res.json({
      message: 'Resolution confirmed',
      issue: { id: issue._id, status: issue.status, resolutionConfirmed: issue.resolutionConfirmed }
    });
  } catch (error) {
    console.error('Confirm resolution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin2: Get progress and recent reports for a specific admin1 based on updates they performed
router.get('/admin/:adminId/progress', authenticateToken, requireRole(['admin2']), async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin1') {
      return res.status(404).json({ message: 'Admin1 not found' });
    }

    // Compute counts directly in the database using aggregation (assigned issues only)
    const grouped = await Issue.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(adminId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = { total: 0, resolved: 0, in_progress: 0, pending: 0, acknowledged: 0 };
    for (const row of grouped) {
      counts.total += row.count;
      if (row._id === 'resolved') counts.resolved = row.count;
      if (row._id === 'in_progress') counts.in_progress = row.count;
      if (row._id === 'pending') counts.pending = row.count;
      if (row._id === 'acknowledged') counts.acknowledged = row.count;
    }

    // Fallback: if no assigned issues, compute counts based on issues handled by this admin via updates
    if (counts.total === 0) {
      const handledIssueIds = await IssueUpdate.distinct('issue', { updatedBy: adminId });
      if (handledIssueIds.length > 0) {
        const handledGrouped = await Issue.aggregate([
          { $match: { _id: { $in: handledIssueIds.map(id => new mongoose.Types.ObjectId(id)) } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        counts.total = 0;
        counts.resolved = 0;
        counts.in_progress = 0;
        counts.pending = 0;
        counts.acknowledged = 0;
        for (const row of handledGrouped) {
          counts.total += row.count;
          if (row._id === 'resolved') counts.resolved = row.count;
          if (row._id === 'in_progress') counts.in_progress = row.count;
          if (row._id === 'pending') counts.pending = row.count;
          if (row._id === 'acknowledged') counts.acknowledged = row.count;
        }
      }
    }

    // Recent assigned issues (sorted by most recent activity)
    let recentIssuesOrdered = await Issue.find({ assignedTo: adminId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('citizen', 'name email')
      .populate('assignedTo', 'name email');
    if (recentIssuesOrdered.length === 0) {
      const recentUpdates = await IssueUpdate.find({ updatedBy: adminId })
        .sort({ createdAt: -1 })
        .limit(50);
      const orderedIds = [];
      const seen = new Set();
      for (const u of recentUpdates) {
        const idStr = u.issue.toString();
        if (!seen.has(idStr)) {
          seen.add(idStr);
          orderedIds.push(u.issue);
        }
        if (orderedIds.length >= 5) break;
      }
      if (orderedIds.length > 0) {
        const recents = await Issue.find({ _id: { $in: orderedIds } })
          .populate('citizen', 'name email')
          .populate('assignedTo', 'name email');
        recentIssuesOrdered = orderedIds
          .map(id => recents.find(i => i._id.toString() === id.toString()))
          .filter(Boolean);
      }
    }

    res.json({
      admin: { id: admin._id, name: admin.name, email: admin.email },
      counts,
      recentIssues: recentIssuesOrdered,
    });
  } catch (error) {
    console.error('Admin progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

