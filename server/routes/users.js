const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Authority only)
router.get('/', protect, authorize('authority', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Search by name or email
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message,
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Authority only or own profile)
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    // Check if user is accessing their own profile or is authority
    if (req.user.id !== req.params.id && !['authority', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message,
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Authority only or own profile)
router.put('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    // Check if user is updating their own profile or is authority
    if (req.user.id !== req.params.id && !['authority', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { name, email, phone, address, preferences, role } = req.body;

    // Residents cannot change their role
    const updateData = { name, email, phone, address, preferences };
    if (['authority', 'admin'].includes(req.user.role) && role) {
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

// @desc    Deactivate user
// @route   DELETE /api/users/:id
// @access  Private (Authority only)
router.delete('/:id', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message,
    });
  }
});

// @desc    Reactivate user
// @route   PATCH /api/users/:id/reactivate
// @access  Private (Authority only)
router.patch('/:id/reactivate', protect, authorize('authority', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User reactivated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate user',
      error: error.message,
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private (Authority only or own stats)
router.get('/:id/stats', protect, validateObjectId('id'), async (req, res) => {
  try {
    // Check if user is accessing their own stats or is authority
    if (req.user.id !== req.params.id && !['authority', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const userId = req.params.id;

    // Import models here to avoid circular dependencies
    const PickupRequest = require('../models/PickupRequest');
    const Report = require('../models/Report');
    const RecyclingStats = require('../models/RecyclingStats');

    const [
      totalPickups,
      completedPickups,
      totalReports,
      resolvedReports,
      recyclingStats,
    ] = await Promise.all([
      PickupRequest.countDocuments({ user: userId }),
      PickupRequest.countDocuments({ user: userId, status: 'completed' }),
      Report.countDocuments({ user: userId }),
      Report.countDocuments({ user: userId, status: 'resolved' }),
      RecyclingStats.findOne({ user: userId, period: 'monthly' }).sort({ date: -1 }),
    ]);

    const stats = {
      pickups: {
        total: totalPickups,
        completed: completedPickups,
        completionRate: totalPickups > 0 ? Math.round((completedPickups / totalPickups) * 100) : 0,
      },
      reports: {
        total: totalReports,
        resolved: resolvedReports,
        resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0,
      },
      recycling: recyclingStats ? {
        monthlyWeight: recyclingStats.totals.weight,
        co2Saved: recyclingStats.totals.co2Saved,
        waterSaved: recyclingStats.totals.waterSaved,
        energySaved: recyclingStats.totals.energySaved,
      } : null,
    };

    res.json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message,
    });
  }
});

// @desc    Get users by location
// @route   GET /api/users/nearby
// @access  Private (Authority only)
router.get('/nearby', protect, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const users = await User.find({
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      },
      isActive: true,
    }).select('-password').limit(50);

    res.json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby users',
      error: error.message,
    });
  }
});

module.exports = router;