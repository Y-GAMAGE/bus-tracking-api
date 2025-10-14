// src/models/Route.js
const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    required: true
  },
  coordinates: {
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
  estimatedArrivalOffset: {
    type: Number, // minutes from start
    required: true
  },
  distanceFromStart: {
    type: Number, // km from route start
    default: 0
  }
}, { _id: false });

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Route name is required']
  },
  origin: {
    city: String,
    terminal: String
  },
  destination: {
    city: String,
    terminal: String
  },
  distance: {
    type: Number, // total km
    required: true
  },
  estimatedDuration: {
    type: Number, // total minutes
    required: true
  },
  stops: [stopSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
routeSchema.index({ routeId: 1 });
routeSchema.index({ 'stops.coordinates': '2dsphere' });

module.exports = mongoose.model('Route', routeSchema);