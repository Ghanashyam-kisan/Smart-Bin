const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
  },
  type: {
    type: String,
    enum: ['overflow', 'damage', 'maintenance', 'contamination', 'missing', 'vandalism', 'other'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  location: {
    address: String,
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
  },
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'in-progress', 'resolved', 'closed', 'rejected'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  images: [{
    url: String,
    filename: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolution: {
    description: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    actionsTaken: [String],
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    submittedAt: Date,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  tags: [String],
}, {
  timestamps: true,
});

// Indexes
reportSchema.index({ 'location.coordinates': '2dsphere' });
reportSchema.index({ user: 1, status: 1 });
reportSchema.index({ bin: 1, status: 1 });
reportSchema.index({ type: 1, severity: 1 });
reportSchema.index({ assignedTo: 1, status: 1 });

// Generate unique report ID
reportSchema.pre('save', async function(next) {
  if (!this.reportId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    });
    
    this.reportId = `RPT${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Update status with history
reportSchema.methods.updateStatus = function(newStatus, updatedBy, notes) {
  this.statusHistory.push({
    status: this.status,
    updatedBy,
    notes,
  });
  this.status = newStatus;
  return this.save();
};

// Check if report is overdue
reportSchema.virtual('isOverdue').get(function() {
  const daysSinceCreated = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
  const maxDays = this.severity === 'critical' ? 1 : this.severity === 'high' ? 3 : 7;
  return daysSinceCreated > maxDays && !['resolved', 'closed'].includes(this.status);
});

// Get reports by location
reportSchema.statics.findNearby = function(coordinates, maxDistance = 1000) {
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
    status: { $nin: ['closed', 'rejected'] },
  });
};

module.exports = mongoose.model('Report', reportSchema);