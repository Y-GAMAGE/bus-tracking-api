const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus ID is required']
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;      // latitude
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  speed: {
    type: Number, // km/h
    default: 0,
    min: 0,
    max: 150
  },
  heading: {
    type: Number, // degrees (0-360)
    default: 0,
    min: 0,
    max: 360
  },
  altitude: {
    type: Number, // meters
    default: 0
  },
  accuracy: {
    type: Number, // meters
    default: 0,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  address: {
    type: String // Reverse geocoded address
  },
  nearestStop: {
    name: String,
    distance: Number // meters
  },
  status: {
    type: String,
    enum: ['moving', 'stopped', 'idle'],
    default: 'moving'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  source: {
    type: String,
    enum: ['gps', 'network', 'manual'],
    default: 'gps'
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
locationSchema.index({ location: '2dsphere' });

// Compound indexes for efficient queries
locationSchema.index({ busId: 1, timestamp: -1 });
locationSchema.index({ tripId: 1, timestamp: -1 });
locationSchema.index({ timestamp: 1 });

// TTL index - automatically delete location records older than 30 days
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Virtual for formatted coordinates
locationSchema.virtual('latitude').get(function() {
  return this.location.coordinates[1];
});

locationSchema.virtual('longitude').get(function() {
  return this.location.coordinates[0];
});

// Static method to get recent locations for a bus
locationSchema.statics.getRecentLocations = function(busId, limit = 10) {
  return this.find({ busId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-__v');
};

// Static method to get location history for a time range
locationSchema.statics.getLocationHistory = function(busId, startTime, endTime) {
  return this.find({
    busId,
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  }).sort({ timestamp: 1 });
};

module.exports = mongoose.model('Location', locationSchema);