const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: [true, 'Bus registration number is required'],
    uppercase: true
  },
  
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip ID is required']
  },
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  
  speed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  heading: {
    type: Number,
    default: 0,
    min: 0,
    max: 360
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  status: {
    type: String,
    enum: ['moving', 'stopped', 'at-stop', 'breakdown'],
    default: 'moving'
  },
  
  source: {
    type: String,
    enum: ['gps', 'manual', 'simulation'],
    default: 'gps'
  }
}, {
  timestamps: true
});

// Indexes
locationSchema.index({ registrationNumber: 1, timestamp: -1 });
locationSchema.index({ tripId: 1, timestamp: -1 });
locationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Location', locationSchema);