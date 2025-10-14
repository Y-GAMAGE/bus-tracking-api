const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    uppercase: true,
    match: [/^[A-Z]{2,3}-[0-9]{4}$/, 'Invalid registration format (e.g., WP-1234)']
  },

  capacity: {
    type: Number,
    required: true,
    min: [20, 'Capacity must be at least 20'],
    max: [60, 'Capacity cannot exceed 60']
  },

  // ✅ FIXED - Default value matches enum
  type: {
    type: String,
    enum: ['AC', 'Private', 'CTB'],
    default: 'CTB',  // ✅ Changed to valid enum value
    required: true
  },

  permitNumber: {
    type: String,
    required: [true, 'Permit number is required']
  },



  operator: {
    username: {
      type: String,
      required: [true, 'Operator username is required']  
    },
    phone: String
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

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


// Compound indexes for common queries
busSchema.index({ registrationNumber: 1 });
busSchema.index({ type: 1, isActive: 1 });
busSchema.index({ 'operator.username': 1 });


busSchema.virtual('fullIdentifier').get(function() {
  return `${this.registrationNumber}`;
});

module.exports = mongoose.model('Bus', busSchema);