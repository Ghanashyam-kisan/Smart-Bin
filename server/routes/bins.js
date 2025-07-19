const express = require('express');
const Bin = require('../models/Bin');
const { protect, authorize } = require('../middleware/auth');
const { validateBinCreation, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all bins
// @route   GET /api/bins
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by zone (for authorities)
    if (req.query.zone && req.user.role === 'authority') {
      query['location.zone'] = req.query.zone;
    }

    // For residents, only show assigned bins
    if (req.user.role === 'resident') {
      query.assignedUsers = req.user.id;
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

    const bins = await Bin.find(query)
      .populate('assignedUsers', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bin.countDocuments(query);

    res.json({
      success: true,
      data: {
        bins,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get bins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bins',
      error: error.message,
    });
  }
});

// @desc    Get single bin
// @route   GET /api/bins/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id)
      .populate('assignedUsers', 'name email phone')
      .populate('maintenanceHistory.performedBy', 'name');

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found',
      });
    }

    // Check access permissions
    if (req.user.role === 'resident' && !bin.assignedUsers.some(user => user._id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this bin',
      });
    }

    res.json({
      success: true,
      data: {
        bin,
      },
    });
  } catch (error) {
    console.error('Get bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bin',
      error: error.message,
    });
  }
});

// @desc    Create new bin
// @route   POST /api/bins
// @access  Private (Authority only)
router.post('/', protect, authorize('authority', 'admin'), validateBinCreation, async (req, res) => {
  try {
    const bin = await Bin.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Bin created successfully',
      data: {
        bin,
      },
    });
  } catch (error) {
    console.error('Create bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bin',
      error: error.message,
    });
  }
});

// @desc    Update bin
// @route   PUT /api/bins/:id
// @access  Private (Authority only)
router.put('/:id', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const bin = await Bin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found',
      });
    }

    res.json({
      success: true,
      message: 'Bin updated successfully',
      data: {
        bin,
      },
    });
  } catch (error) {
    console.error('Update bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bin',
      error: error.message,
    });
  }
});

// @desc    Update bin status
// @route   PATCH /api/bins/:id/status
// @access  Private
router.patch('/:id/status', protect, validateObjectId('id'), async (req, res) => {
  try {
    const { status, fillLevel } = req.body;

    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found',
      });
    }

    // Update fill level if provided
    if (fillLevel !== undefined) {
      bin.capacity.current = fillLevel;
      await bin.updateStatus();
    } else if (status) {
      bin.status = status;
    }

    // Update sensor data if available
    if (req.body.sensorData) {
      if (req.body.sensorData.fillLevel !== undefined) {
        bin.sensors.fillLevel.lastReading = req.body.sensorData.fillLevel;
        bin.sensors.fillLevel.lastUpdate = new Date();
      }
      if (req.body.sensorData.temperature !== undefined) {
        bin.sensors.temperature.lastReading = req.body.sensorData.temperature;
        bin.sensors.temperature.lastUpdate = new Date();
      }
    }

    await bin.save();

    res.json({
      success: true,
      message: 'Bin status updated successfully',
      data: {
        bin,
      },
    });
  } catch (error) {
    console.error('Update bin status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bin status',
      error: error.message,
    });
  }
});

// @desc    Add maintenance record
// @route   POST /api/bins/:id/maintenance
// @access  Private (Authority only)
router.post('/:id/maintenance', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const { type, description } = req.body;

    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found',
      });
    }

    bin.maintenanceHistory.push({
      type,
      description,
      performedBy: req.user.id,
    });

    await bin.save();

    res.json({
      success: true,
      message: 'Maintenance record added successfully',
      data: {
        bin,
      },
    });
  } catch (error) {
    console.error('Add maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add maintenance record',
      error: error.message,
    });
  }
});

// @desc    Assign users to bin
// @route   POST /api/bins/:id/assign
// @access  Private (Authority only)
router.post('/:id/assign', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'userIds must be an array',
      });
    }

    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found',
      });
    }

    bin.assignedUsers = userIds;
    await bin.save();

    await bin.populate('assignedUsers', 'name email');

    res.json({
      success: true,
      message: 'Users assigned to bin successfully',
      data: {
        bin,
      },
    });
  } catch (error) {
    console.error('Assign users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign users to bin',
      error: error.message,
    });
  }
});

// @desc    Get bins needing pickup
// @route   GET /api/bins/pickup-needed
// @access  Private (Authority only)
router.get('/pickup-needed', protect, authorize('authority', 'admin'), async (req, res) => {
  try {
    const bins = await Bin.find({
      status: { $in: ['full', 'overflowing', 'three-quarter-full'] },
      isActive: true,
    })
      .populate('assignedUsers', 'name email phone')
      .sort({ status: -1, 'capacity.current': -1 });

    res.json({
      success: true,
      data: {
        bins,
        count: bins.length,
      },
    });
  } catch (error) {
    console.error('Get pickup needed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bins needing pickup',
      error: error.message,
    });
  }
});

// @desc    Delete bin
// @route   DELETE /api/bins/:id
// @access  Private (Authority only)
router.delete('/:id', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found',
      });
    }

    // Soft delete
    bin.isActive = false;
    await bin.save();

    res.json({
      success: true,
      message: 'Bin deleted successfully',
    });
  } catch (error) {
    console.error('Delete bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bin',
      error: error.message,
    });
  }
});

module.exports = router;