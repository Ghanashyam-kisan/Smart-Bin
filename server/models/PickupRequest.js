const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  requestId: {
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
    required: true,
  },
  requestedDate: {
    type: Date,
    required: true,
  },
  preferredTimeSlot: {
    start: String, // e.g., "09:00"
    end: String,   // e.g., "11:00"
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'scheduled', 'in-progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending',
  },
  type: {
    type: String,
    enum: ['regular', 'emergency', 'bulk', 'special'],
    default: 'regular',
  },
  notes: String,
  estimatedWeight: Number, // in kg
  actualWeight: Number,    // filled after pickup
  assignedTo: {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vehicle: String,
    route: String,
  },
  scheduledDateTime: Date,
  completedDateTime: Date,
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    submittedAt: Date,
  },
  images: [{
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  }],
}, {
  timestamps: true,
});

// Indexes
pickupRequestSchema.index({ user: 1, status: 1 });
pickupRequestSchema.index({ bin: 1, status: 1 });
pickupRequestSchema.index({ requestedDate: 1, status: 1 });
pickupRequestSchema.index({ 'assignedTo.driver': 1, status: 1 });

// Generate unique request ID
pickupRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
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
    
    this.requestId = `PR${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Update status with history
pickupRequestSchema.methods.updateStatus = function(newStatus, updatedBy, notes) {
  this.statusHistory.push({
    status: this.status,
    updatedBy,
    notes,
  });
  this.status = newStatus;
  return this.save();
};

// Check if request is overdue
pickupRequestSchema.virtual('isOverdue').get(function() {
  return this.requestedDate < new Date() && ['pending', 'approved', 'scheduled'].includes(this.status);
});

// Get requests by status
pickupRequestSchema.statics.getByStatus = function(status, limit = 50) {
  return this.find({ status })
    .populate('user', 'name email phone')
    .populate('bin', 'binId type location status')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);