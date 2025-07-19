const express = require('express');
const RecyclingStats = require('../models/RecyclingStats');
const PickupRequest = require('../models/PickupRequest');
const Report = require('../models/Report');
const Bin = require('../models/Bin');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user recycling stats
// @route   GET /api/stats/recycling
// @access  Private
router.get('/recycling', protect, async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let query = { user: req.user.id, period };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Default to current period
      const now = new Date();
      if (period === 'monthly') {
        query.date = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      } else if (period === 'yearly') {
        query.date = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31),
        };
      }
    }

    const stats = await RecyclingStats.find(query).sort({ date: -1 });

    // Calculate totals
    const totals = stats.reduce((acc, stat) => {
      acc.weight += stat.totals.weight;
      acc.co2Saved += stat.totals.co2Saved;
      acc.waterSaved += stat.totals.waterSaved;
      acc.energySaved += stat.totals.energySaved;
      acc.items += stat.totals.items;
      return acc;
    }, {
      weight: 0,
      co2Saved: 0,
      waterSaved: 0,
      energySaved: 0,
      items: 0,
    });

    // Get achievements
    const allAchievements = stats.flatMap(stat => stat.achievements);

    res.json({
      success: true,
      data: {
        stats,
        totals,
        achievements: allAchievements,
        period,
      },
    });
  } catch (error) {
    console.error('Get recycling stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recycling statistics',
      error: error.message,
    });
  }
});

// @desc    Update user recycling stats
// @route   POST /api/stats/recycling
// @access  Private
router.post('/recycling', protect, async (req, res) => {
  try {
    const { period, date, materials } = req.body;

    if (!period || !date || !materials) {
      return res.status(400).json({
        success: false,
        message: 'Period, date, and materials are required',
      });
    }

    const statsDate = new Date(date);
    
    // Find existing stats or create new
    let stats = await RecyclingStats.findOne({
      user: req.user.id,
      period,
      date: statsDate,
    });

    if (stats) {
      // Update existing stats
      stats.materials = materials;
    } else {
      // Create new stats
      stats = new RecyclingStats({
        user: req.user.id,
        period,
        date: statsDate,
        materials,
      });
    }

    await stats.save();

    // Check for new achievements
    const newAchievements = stats.checkAchievements();

    res.json({
      success: true,
      message: 'Recycling stats updated successfully',
      data: {
        stats,
        newAchievements,
      },
    });
  } catch (error) {
    console.error('Update recycling stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recycling statistics',
      error: error.message,
    });
  }
});

// @desc    Get recycling leaderboard
// @route   GET /api/stats/leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { period = 'monthly', limit = 10 } = req.query;

    const leaderboard = await RecyclingStats.getLeaderboard(period, parseInt(limit));

    res.json({
      success: true,
      data: {
        leaderboard,
        period,
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message,
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'resident') {
      // Resident dashboard stats
      const [
        myBins,
        pendingPickups,
        myReports,
        recyclingStats,
      ] = await Promise.all([
        Bin.countDocuments({ assignedUsers: userId, isActive: true }),
        PickupRequest.countDocuments({ user: userId, status: { $in: ['pending', 'approved', 'scheduled'] } }),
        Report.countDocuments({ user: userId, status: { $nin: ['closed', 'rejected'] } }),
        RecyclingStats.findOne({ user: userId, period: 'monthly' }).sort({ date: -1 }),
      ]);

      stats = {
        myBins,
        pendingPickups,
        myReports,
        monthlyRecycling: recyclingStats ? recyclingStats.totals.weight : 0,
        co2Saved: recyclingStats ? recyclingStats.totals.co2Saved : 0,
      };
    } else if (userRole === 'authority') {
      // Authority dashboard stats
      const [
        totalBins,
        overflowingBins,
        pendingPickups,
        openReports,
        todayPickups,
      ] = await Promise.all([
        Bin.countDocuments({ isActive: true }),
        Bin.countDocuments({ status: 'overflowing', isActive: true }),
        PickupRequest.countDocuments({ status: { $in: ['pending', 'approved'] } }),
        Report.countDocuments({ status: 'open' }),
        PickupRequest.countDocuments({
          scheduledDateTime: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999),
          },
          status: { $in: ['scheduled', 'in-progress'] },
        }),
      ]);

      stats = {
        totalBins,
        overflowingBins,
        pendingPickups,
        openReports,
        todayPickups,
      };
    }

    res.json({
      success: true,
      data: {
        stats,
        userRole,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message,
    });
  }
});

// @desc    Get system-wide statistics
// @route   GET /api/stats/system
// @access  Private (Authority only)
router.get('/system', protect, authorize('authority', 'admin'), async (req, res) => {
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

    const [
      binStats,
      pickupStats,
      reportStats,
      recyclingStats,
    ] = await Promise.all([
      // Bin statistics
      Bin.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalBins: { $sum: 1 },
            emptyBins: { $sum: { $cond: [{ $eq: ['$status', 'empty'] }, 1, 0] } },
            halfFullBins: { $sum: { $cond: [{ $eq: ['$status', 'half-full'] }, 1, 0] } },
            fullBins: { $sum: { $cond: [{ $eq: ['$status', 'full'] }, 1, 0] } },
            overflowingBins: { $sum: { $cond: [{ $eq: ['$status', 'overflowing'] }, 1, 0] } },
          },
        },
      ]),

      // Pickup statistics
      PickupRequest.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalPickups: { $sum: 1 },
            completedPickups: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            pendingPickups: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            averageRating: { $avg: '$feedback.rating' },
            totalWeight: { $sum: '$actualWeight' },
          },
        },
      ]),

      // Report statistics
      Report.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            openReports: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            resolvedReports: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            averageResolutionTime: { $avg: { $subtract: ['$resolution.resolvedAt', '$createdAt'] } },
          },
        },
      ]),

      // Recycling statistics
      RecyclingStats.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalWeight: { $sum: '$totals.weight' },
            totalCO2Saved: { $sum: '$totals.co2Saved' },
            totalWaterSaved: { $sum: '$totals.waterSaved' },
            totalEnergySaved: { $sum: '$totals.energySaved' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        bins: binStats[0] || {},
        pickups: pickupStats[0] || {},
        reports: reportStats[0] || {},
        recycling: recyclingStats[0] || {},
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system statistics',
      error: error.message,
    });
  }
});

// @desc    Get trends data
// @route   GET /api/stats/trends
// @access  Private (Authority only)
router.get('/trends', protect, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    // Get pickup trends
    const pickupTrends = await PickupRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'daily' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get report trends
    const reportTrends = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'daily' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        pickupTrends,
        reportTrends,
        period,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trends data',
      error: error.message,
    });
  }
});

module.exports = router;