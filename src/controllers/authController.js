const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,        // User's database ID
      role: user.role,     // User's role (admin, driver, passenger)
      email: user.email    // Optional: include email for easier debugging
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE || '24h'
//   });
// };

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, phone, profile, driverDetails, operatorDetails } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

   

    // Prepare user data
    const userData = {
      username,
      email,
      password,
      role: role || 'passenger',
      phone,
      profile
    };

    // // Add role-specific details
    // if (role === 'driver' && driverDetails) {
    //   userData.driverDetails = {
    //     licenseNumber: driverDetails.licenseNumber,
    //     licenseExpiry: driverDetails.licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year from now
    //     experienceYears: driverDetails.experienceYears || 0,
    //     emergencyContact: driverDetails.emergencyContact || '',
    //     medicalCertificateExpiry: driverDetails.medicalCertificateExpiry
    //   };
    // }

    // if (role === 'operator' && operatorDetails) {
    //   userData.operatorDetails = {
    //     companyName: operatorDetails.companyName,
    //     businessLicense: operatorDetails.businessLicense,
    //     contactPerson: operatorDetails.contactPerson || '',
    //     businessAddress: operatorDetails.businessAddress || ''
    //   };
    // }

    // Add optional details if provided
    if (driverDetails) {
      userData.driverDetails = driverDetails;
    }

    if (operatorDetails) {
      userData.operatorDetails = operatorDetails;
    }
    // Create user
    const user = await User.create(userData);

    // Generate token - FIX: Pass user object, not just ID
    const token = generateToken(user);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: `${role || 'User'} registered successfully`,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
};
/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token - FIX: Pass user object, not just ID
    const token = generateToken(user);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['username', 'phone', 'profile'];
    // Add role-specific allowed updates
    if (req.user.role === 'driver') {
      allowedUpdates.push('driverDetails');
    }
    if (req.user.role === 'operator') {
      allowedUpdates.push('operatorDetails');
    }

    const updates = {};

    // Only allow certain fields to be updated
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // We can optionally log this action
    
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove token from client.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

/**
 * @desc    Forgot password - Send reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save();

    // In production, send email with reset token
    // For now, return token in response (FOR TESTING ONLY)
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken, // REMOVE THIS IN PRODUCTION - should be sent via email
      instructions: 'Use this token with /reset-password endpoint'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request'
    });
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Hash the token from request to compare with stored hash
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

/**
 * @desc    Verify token (check if token is valid)
 * @route   GET /api/auth/verify
 * @access  Private
 */
exports.verifyToken = async (req, res) => {
  try {
    // If we reach here, token is valid (auth middleware passed)
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.user.id,
        role: req.user.role,
        email: req.user.email,
        username: req.user.username
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying token'
    });
  }
};