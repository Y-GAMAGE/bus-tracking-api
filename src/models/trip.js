// src/models/Trip.js
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
    // e.g., "CMB-KDY-20241014-0800"
  },
  
 registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    uppercase: true,
    match: [/^[A-Z]{2,3}-[0-9]{4}$/, 'Invalid registration format (e.g., WP-1234)']
  },
  
   routeId: {
    type: String,
    required: true,
    uppercase: true
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  scheduledStartTime: {
    type: Date,
    required: [true, 'Scheduled start time is required']
  },
  scheduledEndTime: {
    type: Date,
    required: [true, 'Scheduled end time is required']
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  
  // Current status
  status: {
    type: String,
    enum: ['scheduled', 'started', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  
  currentStop: {
    type: String, // Actual stop name instead of index
    default: null
  },
  
  // Stop performance tracking
stopArrivals: [{
  stopName: {
    type: String,
    required: true
  },
  estimatedArrival: {
    type: Date,
    required: true
  },
  actualArrival: {
    type: Date
  },
  delayMinutes: {  // ✅ Change from 'delay' to 'delayMinutes'
    type: Number,
    default: 0
  },
  hasPassed: {
    type: Boolean,
    default: false
  }
}],
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
tripSchema.index({ tripId: 1 });
tripSchema.index({ registrationNumber: 1, scheduledDate: 1 });
tripSchema.index({ routeId: 1, scheduledDate: 1 });

module.exports = mongoose.model('Trip', tripSchema);