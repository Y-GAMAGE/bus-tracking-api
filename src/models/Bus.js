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
    uppercase: true
  },
  
  // ✅ SIMPLE & PRACTICAL - Just store route name directly
  routeName: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true
    // Examples: "Colombo - Kandy", "Colombo - Galle", "Kandy - Jaffna"
  },
  
  capacity: {
    type: Number,
    required: true,
    min: [20, 'Capacity must be at least 20']
  },
  
  type: {
    type: String,
    enum: ['normal', 'semi-luxury', 'luxury', 'super-luxury'],
    default: 'normal'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'en-route', 'at-stop'],
    default: 'active'
  },

  // ...rest of your fields
}, {
  timestamps: true
});

// ✅ Index for route name queries
busSchema.index({ routeName: 1 });
busSchema.index({ routeName: 1, status: 1 });