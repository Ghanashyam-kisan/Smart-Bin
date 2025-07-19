const mongoose = require('mongoose');

const recyclingStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  materials: {
    plastic: {
      weight: { type: Number, default: 0 }, // in kg
      items: { type: Number, default: 0 },
      co2Saved: { type: Number, default: 0 },
    },
    paper: {
      weight: { type: Number, default: 0 },
      items: { type: Number, default: 0 },
      co2Saved: { type: Number, default: 0 },
    },
    glass: {
      weight: { type: Number, default: 0 },
      items: { type: Number, default: 0 },
      co2Saved: { type: Number, default: 0 },
    },
    metal: {
      weight: { type: Number, default: 0 },
      items: { type: Number, default: 0 },
      co2Saved: { type: Number, default: 0 },
    },
    organic: {
      weight: { type: Number, default: 0 },
      items: { type: Number, default: 0 },
      co2Saved: { type: Number, default: 0 },
    },
  },
  totals: {
    weight: { type: Number, default: 0 },
    items: { type: Number, default: 0 },
    co2Saved: { type: Number, default: 0 },
    waterSaved: { type: Number, default: 0 }, // in liters
    energySaved: { type: Number, default: 0 }, // in kWh
  },
  achievements: [{
    type: String,
    earnedAt: { type: Date, default: Date.now },
    description: String,
  }],
  goals: {
    weightTarget: Number,
    co2Target: Number,
    achieved: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

// Compound index for user and period
recyclingStatsSchema.index({ user: 1, period: 1, date: 1 }, { unique: true });

// Calculate totals before saving
recyclingStatsSchema.pre('save', function(next) {
  const materials = this.materials;
  
  this.totals.weight = Object.values(materials).reduce((sum, material) => sum + material.weight, 0);
  this.totals.items = Object.values(materials).reduce((sum, material) => sum + material.items, 0);
  this.totals.co2Saved = Object.values(materials).reduce((sum, material) => sum + material.co2Saved, 0);
  
  // Calculate water and energy saved based on materials
  this.totals.waterSaved = (materials.paper.weight * 35) + (materials.plastic.weight * 15);
  this.totals.energySaved = (materials.metal.weight * 2.5) + (materials.glass.weight * 0.8);
  
  next();
});

// Static method to get user stats for a period
recyclingStatsSchema.statics.getUserStats = function(userId, period, startDate, endDate) {
  const query = { user: userId, period };
  
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ date: -1 });
};

// Static method to get leaderboard
recyclingStatsSchema.statics.getLeaderboard = function(period, limit = 10) {
  return this.aggregate([
    { $match: { period } },
    {
      $group: {
        _id: '$user',
        totalWeight: { $sum: '$totals.weight' },
        totalCO2Saved: { $sum: '$totals.co2Saved' },
        totalItems: { $sum: '$totals.items' },
      },
    },
    { $sort: { totalWeight: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        'user.name': 1,
        'user.email': 1,
        totalWeight: 1,
        totalCO2Saved: 1,
        totalItems: 1,
      },
    },
  ]);
};

// Method to check and award achievements
recyclingStatsSchema.methods.checkAchievements = function() {
  const achievements = [];
  
  // Weight-based achievements
  if (this.totals.weight >= 50 && !this.achievements.find(a => a.type === 'weight_50kg')) {
    achievements.push({
      type: 'weight_50kg',
      description: 'Recycled 50kg of materials',
    });
  }
  
  // CO2 savings achievements
  if (this.totals.co2Saved >= 25 && !this.achievements.find(a => a.type === 'co2_25kg')) {
    achievements.push({
      type: 'co2_25kg',
      description: 'Saved 25kg of CO₂ emissions',
    });
  }
  
  // Add new achievements
  this.achievements.push(...achievements);
  
  return achievements;
};

module.exports = mongoose.model('RecyclingStats', recyclingStatsSchema);