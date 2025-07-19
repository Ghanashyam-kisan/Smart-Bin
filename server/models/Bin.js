const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  type: {
    type: String,
    enum: ['general', 'recycling', 'organic', 'hazardous'],
    required: true,
  },
  location: {
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    zone: String,
    route: String,
  },
  status: {
    type: String,
    enum: ['empty', 'quarter-full', 'half-full', 'three-quarter-full', 'full', 'overflowing'],
    default: 'empty',
  },
  capacity: {
    total: { type: Number, default: 100 }, // in liters
    current: { type: Number, default: 0 },
  },
  lastEmptied: {
    type: Date,
    default: Date.now,
  },
  nextScheduledPickup: Date,
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  maintenanceHistory: [{
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['cleaning', 'repair', 'replacement'] },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  sensors: {
    fillLevel: {
      enabled: { type: Boolean, default: false },
      lastReading: Number,
      lastUpdate: Date,
    },
    temperature: {
      enabled: { type: Boolean, default: false },
      lastReading: Number,
      lastUpdate: Date,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  installationDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
binSchema.index({ 'location.coordinates': '2dsphere' });
binSchema.index({ binId: 1 });
binSchema.index({ type: 1, status: 1 });
binSchema.index({ 'location.zone': 1, 'location.route': 1 });

// Virtual for fill percentage
binSchema.virtual('fillPercentage').get(function() {
  return Math.round((this.capacity.current / this.capacity.total) * 100);
});

// Update status based on fill level
binSchema.methods.updateStatus = function() {
  const fillPercentage = this.fillPercentage;
  
  if (fillPercentage >= 100) {
    this.status = 'overflowing';
  } else if (fillPercentage >= 75) {
    this.status = 'three-quarter-full';
  } else if (fillPercentage >= 50) {
    this.status = 'half-full';
  } else if (fillPercentage >= 25) {
    this.status = 'quarter-full';
  } else {
    this.status = 'empty';
  }
  
  return this.save();
};

// Check if bin needs pickup
binSchema.methods.needsPickup = function() {
  return this.status === 'overflowing' || this.status === 'full' || this.status === 'three-quarter-full';
};

// Get nearby bins
binSchema.statics.findNearby = function(coordinates, maxDistance = 1000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],
        },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
  });
};

module.exports = mongoose.model('Bin', binSchema);