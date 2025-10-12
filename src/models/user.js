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
    select: false
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
    firstName: String,
    lastName: String,
    address: String
  },
  
  // SIMPLIFIED operator details (optional)
  operatorDetails: {
    
    businessLicense: String
  
  },
  
  // SIMPLIFIED driver details (optional)
  driverDetails: {
    licenseNumber: String,
    licenseExpiry: Date,
    experience: Number
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate reset token method
userSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);