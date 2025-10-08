const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required']
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route is required']
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledDeparture: {
    type: Date,
    required: [true, 'Scheduled departure time is required']
  },
  scheduledArrival: {
    type: Date,
    required: [true, 'Scheduled arrival time is required']
  },
  actualDeparture: {
    type: Date
  },
  actualArrival: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed'],
    default: 'scheduled'
  },
  currentStop: {
    stopName: String,
    arrivalTime: Date,
    departureTime: Date
  },
  passengersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  delay: {
    type: Number, // minutes
    default: 0
  },
  fare: {
    type: Number,
    required: true
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: 500
  },
  weather: {
    condition: String,
    temperature: Number
  },
  incidents: [{
    type: {
      type: String,
      enum: ['delay', 'breakdown', 'accident', 'other']
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
tripSchema.index({ tripId: 1 });
tripSchema.index({ busId: 1, status: 1 });
tripSchema.index({ routeId: 1, scheduledDeparture: 1 });
tripSchema.index({ status: 1, scheduledDeparture: 1 });
tripSchema.index({ scheduledDeparture: 1, scheduledArrival: 1 });

// Virtual for trip duration
tripSchema.virtual('duration').get(function() {
  if (this.actualArrival && this.actualDeparture) {
    return Math.round((this.actualArrival - this.actualDeparture) / 60000); // minutes
  }
  return null;
});

// Virtual for trip status summary
tripSchema.virtual('isOnTime').get(function() {
  return this.delay <= 5; // Within 5 minutes is considered on time
});

// Pre-save middleware to generate tripId
tripSchema.pre('save', async function(next) {
  if (this.isNew && !this.tripId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.tripId = `TRIP-${dateStr}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);