const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    uppercase: true,
    match: [/^[A-Z]{2,3}-[0-9]{4}$/, 'Invalid registration format (e.g., WP-1234)']
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route is required']
  },
  capacity: {
    type: Number,
    required: true,
    min: [20, 'Capacity must be at least 20'],
    max: [60, 'Capacity cannot exceed 60']
  },
  type: {
    type: String,
    enum: ['express', 'semi-express', 'normal', 'luxury', 'super-luxury'],
    default: 'normal',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'en-route', 'at-stop', 'breakdown'],
    default: 'inactive'
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [79.8612, 6.9271] // Default to Colombo
    }
  },
  currentTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  driver: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    contactNumber: String,
    licenseNumber: String
  },
  operator: {
    name: {
      type: String,
      required: true
    },
    contactNumber: String,
    permitNumber: String
  },
  amenities: [{
    type: String,
    enum: ['ac', 'wifi', 'charging-ports', 'reclining-seats', 'restroom', 'entertainment', 'gps']
  }],
  specifications: {
    manufacturer: String,
    model: String,
    yearOfManufacture: Number,
    fuelType: {
      type: String,
      enum: ['diesel', 'petrol', 'electric', 'hybrid']
    },
    color: String
  },
  maintenance: {
    lastService: Date,
    nextServiceDue: Date,
    lastInspection: Date,
    nextInspectionDue: Date,
    fitnessExpiry: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
busSchema.index({ currentLocation: '2dsphere' });

// Compound indexes for common queries
busSchema.index({ busNumber: 1 });
busSchema.index({ registrationNumber: 1 });
busSchema.index({ status: 1, routeId: 1 });
busSchema.index({ routeId: 1, status: 1 });

// Virtual for full bus identifier
busSchema.virtual('fullIdentifier').get(function() {
  return `${this.busNumber} (${this.registrationNumber})`;
});

module.exports = mongoose.model('Bus', busSchema);