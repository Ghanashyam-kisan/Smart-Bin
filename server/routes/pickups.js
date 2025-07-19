const express = require('express');
const PickupRequest = require('../models/PickupRequest');
const Bin = require('../models/Bin');
const { protect, authorize } = require('../middleware/auth');
const { validatePickupRequest, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get pickup requests
// @route   GET /api/pickups
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // For residents, only show their requests
    if (req.user.role === 'resident') {
      query.user = req.user.id;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.requestedDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    // Filter by assigned driver (for authorities)
    if (req.query.driver && req.user.role === 'authority') {
      query['assignedTo.driver'] = req.query.driver;
    }

    const pickupRequests = await PickupRequest.find(query)
      .populate('user', 'name email phone address')
      .populate('bin', 'binId type location status')
      .populate('assignedTo.driver', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PickupRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        pickupRequests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get pickup requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pickup requests',
      error: error.message,
    });
  }
});

// @desc    Get single pickup request
// @route   GET /api/pickups/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const pickupRequest = await PickupRequest.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('bin', 'binId type location status')
      .populate('assignedTo.driver', 'name email phone')
      .populate('statusHistory.updatedBy', 'name');

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found',
      });
    }

    // Check access permissions
    if (req.user.role === 'resident' && pickupRequest.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this pickup request',
      });
    }

    res.json({
      success: true,
      data: {
        pickupRequest,
      },
    });
  } catch (error) {
    console.error('Get pickup request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pickup request',
      error: error.message,
    });
  }
});

// @desc    Create pickup request
// @route   POST /api/pickups
// @access  Private
router.post('/', protect, validatePickupRequest, async (req, res) => {
  try {
    const { bin, requestedDate, preferredTimeSlot, priority, type, notes, estimatedWeight } = req.body;

    // Check if bin exists and user has access
    const binDoc = await Bin.findById(bin);
    if (!binDoc) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found',
      });
    }

    // For residents, check if they're assigned to the bin
    if (req.user.role === 'resident' && !binDoc.assignedUsers.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this bin',
      });
    }

    // Check if there's already a pending/scheduled request for this bin on the same date
    const existingRequest = await PickupRequest.findOne({
      bin,
      requestedDate: {
        $gte: new Date(requestedDate).setHours(0, 0, 0, 0),
        $lt: new Date(requestedDate).setHours(23, 59, 59, 999),
      },
      status: { $in: ['pending', 'approved', 'scheduled'] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'A pickup request already exists for this bin on the selected date',
      });
    }

    const pickupRequest = await PickupRequest.create({
      user: req.user.id,
      bin,
      requestedDate,
      preferredTimeSlot,
      priority: priority || 'medium',
      type: type || 'regular',
      notes,
      estimatedWeight,
    });

    await pickupRequest.populate('user', 'name email phone');
    await pickupRequest.populate('bin', 'binId type location');

    res.status(201).json({
      success: true,
      message: 'Pickup request created successfully',
      data: {
        pickupRequest,
      },
    });
  } catch (error) {
    console.error('Create pickup request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pickup request',
      error: error.message,
    });
  }
});

// @desc    Update pickup request status
// @route   PATCH /api/pickups/:id/status
// @access  Private (Authority only for most statuses)
router.patch('/:id/status', protect, validateObjectId('id'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const pickupRequest = await PickupRequest.findById(req.params.id);
    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found',
      });
    }

    // Check permissions
    const isOwner = pickupRequest.user.toString() === req.user.id;
    const isAuthority = req.user.role === 'authority' || req.user.role === 'admin';

    // Residents can only cancel their own pending requests
    if (req.user.role === 'resident') {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      if (status !== 'cancelled' || pickupRequest.status !== 'pending') {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel pending requests',
        });
      }
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['approved', 'rejected', 'cancelled'],
      approved: ['scheduled', 'cancelled'],
      scheduled: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      completed: [], // Final state
      cancelled: [], // Final state
      rejected: [], // Final state
    };

    if (!validTransitions[pickupRequest.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${pickupRequest.status} to ${status}`,
      });
    }

    await pickupRequest.updateStatus(status, req.user.id, notes);

    // If completed, update bin status
    if (status === 'completed') {
      const bin = await Bin.findById(pickupRequest.bin);
      if (bin) {
        bin.lastEmptied = new Date();
        bin.capacity.current = 0;
        await bin.updateStatus();
      }
    }

    await pickupRequest.populate('user', 'name email phone');
    await pickupRequest.populate('bin', 'binId type location');

    res.json({
      success: true,
      message: 'Pickup request status updated successfully',
      data: {
        pickupRequest,
      },
    });
  } catch (error) {
    console.error('Update pickup status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pickup request status',
      error: error.message,
    });
  }
});

// @desc    Assign pickup request to driver
// @route   PATCH /api/pickups/:id/assign
// @access  Private (Authority only)
router.patch('/:id/assign', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const { driver, vehicle, route, scheduledDateTime } = req.body;

    const pickupRequest = await PickupRequest.findById(req.params.id);
    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found',
      });
    }

    if (pickupRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Can only assign approved pickup requests',
      });
    }

    pickupRequest.assignedTo = {
      driver,
      vehicle,
      route,
    };

    if (scheduledDateTime) {
      pickupRequest.scheduledDateTime = scheduledDateTime;
    }

    await pickupRequest.updateStatus('scheduled', req.user.id, 'Assigned to driver');

    await pickupRequest.populate('assignedTo.driver', 'name email phone');

    res.json({
      success: true,
      message: 'Pickup request assigned successfully',
      data: {
        pickupRequest,
      },
    });
  } catch (error) {
    console.error('Assign pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign pickup request',
      error: error.message,
    });
  }
});

// @desc    Add feedback to pickup request
// @route   POST /api/pickups/:id/feedback
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

    const pickupRequest = await PickupRequest.findById(req.params.id);
    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found',
      });
    }

    // Check if user can provide feedback
    if (pickupRequest.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only provide feedback for your own requests',
      });
    }

    if (pickupRequest.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only provide feedback for completed pickups',
      });
    }

    if (pickupRequest.feedback.rating) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already provided for this pickup',
      });
    }

    pickupRequest.feedback = {
      rating,
      comment,
      submittedAt: new Date(),
    };

    await pickupRequest.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        pickupRequest,
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

// @desc    Get pickup statistics
// @route   GET /api/pickups/stats
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

    const stats = await PickupRequest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          averageRating: { $avg: '$feedback.rating' },
          totalWeight: { $sum: '$actualWeight' },
        },
      },
    ]);

    const statusBreakdown = await PickupRequest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityBreakdown = await PickupRequest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          cancelledRequests: 0,
          averageRating: 0,
          totalWeight: 0,
        },
        statusBreakdown,
        priorityBreakdown,
      },
    });
  } catch (error) {
    console.error('Get pickup stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pickup statistics',
      error: error.message,
    });
  }
});

module.exports = router;