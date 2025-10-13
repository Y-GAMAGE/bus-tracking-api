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
  estimatedArrivalOffset: {
    type: Number, // minutes from start
    required: true
  },
  stopDuration: {
    type: Number, // minutes
    default: 5
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
    required: [true, 'Route name is required'],
    trim: true
  },
  origin: {
    city: {
      type: String,
      required: true
    },
    terminal: {
      type: String,
      required: true
    }
  },
  destination: {
    city: {
      type: String,
      required: true
    },
    terminal: {
      type: String,
      required: true
    }
  },
  distance: {
    type: Number,
    required: true,
    min: [1, 'Distance must be at least 1 km']
  },
  estimatedDuration: {
    type: Number, // minutes
    required: true,
    min: [10, 'Duration must be at least 10 minutes']
  },
  stops: [stopSchema],
  fare: {
    normal: {
      type: Number,
      required: true,
      min: 0
    },
    semiExpress: Number,
    express: Number,
    luxury: Number
  },
  status: {
    type: String,
    enum: ['operational', 'suspended', 'delayed', 'under-maintenance'],
    default: 'operational'
  },
  operatingHours: {
    start: {
      type: String, // "05:00"
      default: "05:00"
    },
    end: {
      type: String, // "22:00"
      default: "22:00"
    }
  },
  frequency: {
    type: String, // e.g., "Every 30 minutes"
    required: true
  },
  category: {
    type: String,
    enum: ['inter-provincial', 'provincial', 'local'],
    default: 'inter-provincial'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
routeSchema.index({ routeId: 1 });
routeSchema.index({ status: 1 });
routeSchema.index({ 'origin.city': 1, 'destination.city': 1 });

// Virtual for route direction
routeSchema.virtual('direction').get(function() {
  return `${this.origin.city} → ${this.destination.city}`;
});

module.exports = mongoose.model('Route', routeSchema);