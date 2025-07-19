const express = require('express');
const Report = require('../models/Report');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validateReport, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get reports
// @route   GET /api/reports
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // For residents, only show their reports or public reports
    if (req.user.role === 'resident') {
      query = {
        $or: [
          { user: req.user.id },
          { isPublic: true },
        ],
      };
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by severity
    if (req.query.severity) {
      query.severity = req.query.severity;
    }

    // Filter by assigned user (for authorities)
    if (req.query.assignedTo && req.user.role === 'authority') {
      query.assignedTo = req.query.assignedTo;
    }

    // Location-based search
    if (req.query.lat && req.query.lng) {
      const maxDistance = parseInt(req.query.radius) || 1000; // meters
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)],
          },
          $maxDistance: maxDistance,
        },
      };
    }

    const reports = await Report.find(query)
      .populate('user', 'name email')
      .populate('bin', 'binId type location')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
      error: error.message,
    });
  }
});

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('bin', 'binId type location status')
      .populate('assignedTo', 'name email phone')
      .populate('statusHistory.updatedBy', 'name')
      .populate('resolution.resolvedBy', 'name');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Check access permissions
    if (req.user.role === 'resident') {
      if (report.user._id.toString() !== req.user.id && !report.isPublic) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this report',
        });
      }
    }

    res.json({
      success: true,
      data: {
        report,
      },
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report',
      error: error.message,
    });
  }
});

// @desc    Create report
// @route   POST /api/reports
// @access  Private
router.post('/', protect, validateReport, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      user: req.user.id,
    };

    const report = await Report.create(reportData);

    await report.populate('user', 'name email');
    if (report.bin) {
      await report.populate('bin', 'binId type location');
    }

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        report,
      },
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error.message,
    });
  }
});

// @desc    Update report status
// @route   PATCH /api/reports/:id/status
// @access  Private (Authority only)
router.patch('/:id/status', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Validate status transitions
    const validTransitions = {
      open: ['acknowledged', 'in-progress', 'resolved', 'rejected'],
      acknowledged: ['in-progress', 'resolved', 'rejected'],
      'in-progress': ['resolved', 'closed'],
      resolved: ['closed'],
      closed: [], // Final state
      rejected: [], // Final state
    };

    if (!validTransitions[report.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${report.status} to ${status}`,
      });
    }

    await report.updateStatus(status, req.user.id, notes);

    await report.populate('user', 'name email');

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: {
        report,
      },
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message,
    });
  }
});

// @desc    Assign report to user
// @route   PATCH /api/reports/:id/assign
// @access  Private (Authority only)
router.patch('/:id/assign', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Update status to acknowledged if it's still open
    if (report.status === 'open') {
      await report.updateStatus('acknowledged', req.user.id, 'Assigned to team member');
    }

    res.json({
      success: true,
      message: 'Report assigned successfully',
      data: {
        report,
      },
    });
  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign report',
      error: error.message,
    });
  }
});

// @desc    Resolve report
// @route   PATCH /api/reports/:id/resolve
// @access  Private (Authority only)
router.patch('/:id/resolve', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const { description, actionsTaken } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (!['acknowledged', 'in-progress'].includes(report.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only resolve acknowledged or in-progress reports',
      });
    }

    report.resolution = {
      description,
      actionsTaken: Array.isArray(actionsTaken) ? actionsTaken : [actionsTaken],
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
    };

    await report.updateStatus('resolved', req.user.id, 'Report resolved');

    await report.populate('resolution.resolvedBy', 'name');

    res.json({
      success: true,
      message: 'Report resolved successfully',
      data: {
        report,
      },
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve report',
      error: error.message,
    });
  }
});

// @desc    Add feedback to report
// @route   POST /api/reports/:id/feedback
// @access  Private
router.post('/:id/feedback', protect, validateObjectId('id'), async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Check if user can provide feedback
    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only provide feedback for your own reports',
      });
    }

    if (report.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Can only provide feedback for resolved reports',
      });
    }

    if (report.feedback.rating) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already provided for this report',
      });
    }

    report.feedback = {
      rating,
      comment,
      submittedAt: new Date(),
    };

    await report.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        report,
      },
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message,
    });
  }
});

// @desc    Get public reports (for map display)
// @route   GET /api/reports/public
// @access  Public
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;

    let query = {
      isPublic: true,
      status: { $nin: ['closed', 'rejected'] },
    };

    // Location-based search
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const reports = await Report.find(query)
      .select('type severity title location status createdAt')
      .limit(100)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        reports,
      },
    });
  } catch (error) {
    console.error('Get public reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public reports',
      error: error.message,
    });
  }
});

// @desc    Get report statistics
// @route   GET /api/reports/stats
// @access  Private (Authority only)
router.get('/stats', protect, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    const stats = await Report.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          openReports: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] },
          },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
          },
          averageRating: { $avg: '$feedback.rating' },
        },
      },
    ]);

    const typeBreakdown = await Report.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const severityBreakdown = await Report.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusBreakdown = await Report.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalReports: 0,
          openReports: 0,
          resolvedReports: 0,
          averageRating: 0,
        },
        typeBreakdown,
        severityBreakdown,
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report statistics',
      error: error.message,
    });
  }
});

module.exports = router;