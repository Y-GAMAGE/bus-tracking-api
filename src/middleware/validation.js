/**
 * Validate request body has required fields
 */
exports.validateFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validate email format
 */
exports.validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next();
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  next();
};

/**
 * Validate password strength
 */
exports.validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next();
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  next();
};

/**
 * Validate MongoDB ObjectId
 */
exports.validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};