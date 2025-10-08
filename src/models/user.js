const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'operator', 'driver', 'passenger'],
      message: '{VALUE} is not a valid role'
    },
    default: 'passenger',
    required: true
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  profile: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    nic: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^([0-9]{9}[vVxX]|[0-9]{12})$/, 'Please provide a valid NIC number']
    },
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    profilePicture: String // URL to profile picture
  },
  
  // ========================================
  // OPERATOR-SPECIFIC FIELDS
  // ========================================
  operatorDetails: {
    companyName: {
      type: String,
      trim: true
    },
    permitNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    businessRegistrationNumber: {
      type: String,
      trim: true
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    licenseExpiry: Date,
    operatingRegion: {
      type: String,
      enum: ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa', 'All Provinces']
    },
    assignedRoutes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    }],
    assignedBuses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    }],
    contactPerson: {
      name: String,
      designation: String,
      phone: String,
      email: String
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountHolderName: String,
      branch: String
    },
    taxId: String,
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalTripsCompleted: {
      type: Number,
      default: 0
    }
  },
  
  // ========================================
  // DRIVER-SPECIFIC FIELDS
  // ========================================
  driverDetails: {
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    licenseType: {
      type: String,
      enum: ['Light', 'Heavy', 'Special']
    },
    licenseIssueDate: Date,
    licenseExpiry: Date,
    medicalCertificateNumber: String,
    medicalCertificateExpiry: Date,
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    employeeId: String,
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Reference to operator user
    },
    experience: {
      type: Number, // years
      min: 0,
      max: 50
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalTripsCompleted: {
      type: Number,
      default: 0
    },
    totalKilometersDriven: {
      type: Number,
      default: 0
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    status: {
      type: String,
      enum: ['available', 'on-duty', 'off-duty', 'on-leave'],
      default: 'available'
    },
    shift: {
      type: String,
      enum: ['morning', 'evening', 'night', 'flexible']
    }
  },
  
  // ========================================
  // PASSENGER-SPECIFIC FIELDS
  // ========================================
  passengerDetails: {
    preferredRoutes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    }],
    favoriteStops: [{
      name: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }],
    tripHistory: [{
      tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
      },
      date: Date,
      rating: Number
    }],
    loyaltyPoints: {
      type: Number,
      default: 0
    }
  },
  
  // ========================================
  // COMMON FIELDS FOR ALL USERS
  // ========================================
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  lastLogin: {
    type: Date
  },
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String
  }],
  preferences: {
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========================================
// INDEXES
// ========================================
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'operatorDetails.permitNumber': 1 }, { sparse: true });
userSchema.index({ 'driverDetails.licenseNumber': 1 }, { sparse: true });
userSchema.index({ isActive: 1, role: 1 });

// ========================================
// VIRTUAL FIELDS
// ========================================

// Full name virtual
userSchema.virtual('fullName').get(function() {
  if (this.profile && this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Check if operator license is expired
userSchema.virtual('isOperatorLicenseValid').get(function() {
  if (this.role === 'operator' && this.operatorDetails && this.operatorDetails.licenseExpiry) {
    return new Date() < new Date(this.operatorDetails.licenseExpiry);
  }
  return null;
});

// Check if driver license is expired
userSchema.virtual('isDriverLicenseValid').get(function() {
  if (this.role === 'driver' && this.driverDetails && this.driverDetails.licenseExpiry) {
    return new Date() < new Date(this.driverDetails.licenseExpiry);
  }
  return null;
});

// ========================================
// MIDDLEWARE - PRE SAVE
// ========================================

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastLogin on save if it's a new login
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    // Add to login history
    if (!this.loginHistory) {
      this.loginHistory = [];
    }
    
    // Keep only last 10 login records
    if (this.loginHistory.length >= 10) {
      this.loginHistory.shift();
    }
  }
  next();
});

// ========================================
// INSTANCE METHODS
// ========================================

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if user can perform action based on role
userSchema.methods.can = function(action) {
  const permissions = {
    admin: ['*'], // Admin can do everything
    operator: ['manage_buses', 'manage_routes', 'assign_drivers', 'view_reports', 'manage_trips'],
    driver: ['update_location', 'start_trip', 'end_trip', 'view_assigned_trips'],
    passenger: ['view_buses', 'view_routes', 'track_buses', 'view_schedules']
  };
  
  const userPermissions = permissions[this.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(action);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.__v;
  return obj;
};

// Generate password reset token
userSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpiry = Date.now() + 3600000; // 1 hour
  
  return resetToken;
};

// ========================================
// STATIC METHODS
// ========================================

// Find user by email or username
userSchema.statics.findByCredentials = async function(identifier) {
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password');
  
  return user;
};

// Get all active drivers
userSchema.statics.getActiveDrivers = function() {
  return this.find({
    role: 'driver',
    isActive: true,
    'driverDetails.status': 'available'
  }).select('-password');
};

// Get all operators
userSchema.statics.getActiveOperators = function() {
  return this.find({
    role: 'operator',
    isActive: true
  }).select('-password');
};

// Get users by role
userSchema.statics.getUsersByRole = function(role) {
  return this.find({ role, isActive: true }).select('-password');
};

// ========================================
// VALIDATION
// ========================================

// Validate operator details if role is operator
userSchema.pre('validate', function(next) {
  if (this.role === 'operator') {
    if (!this.operatorDetails || !this.operatorDetails.companyName) {
      this.invalidate('operatorDetails.companyName', 'Company name is required for operators');
    }
  }
  next();
});

// Validate driver details if role is driver
userSchema.pre('validate', function(next) {
  if (this.role === 'driver') {
    if (!this.driverDetails || !this.driverDetails.licenseNumber) {
      this.invalidate('driverDetails.licenseNumber', 'License number is required for drivers');
    }
  }
  next();
});

// ========================================
// EXPORT MODEL
// ========================================
module.exports = mongoose.model('User', userSchema);