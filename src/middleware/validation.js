const mongoose = require('mongoose');

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

/**
 * Validate bus creation data
 */
exports.validateBus = (req, res, next) => {
  const { busNumber, registrationNumber, routeId, capacity, type, operator } = req.body;

  const errors = [];

  // Required fields
  if (!busNumber) errors.push('Bus number is required');
  if (!registrationNumber) errors.push('Registration number is required');
  if (!routeId) errors.push('Route ID is required');
  if (!capacity) errors.push('Capacity is required');
  if (!operator || !operator.name) errors.push('Operator name is required');

  // Bus number validation
  if (busNumber && typeof busNumber !== 'string') {
    errors.push('Bus number must be a string');
  }

  // Registration number format validation
  if (registrationNumber && !/^[A-Z]{2,3}-[0-9]{4}$/i.test(registrationNumber)) {
    errors.push('Registration number format is invalid (e.g., WP-1234)');
  }

  // Capacity validation
  if (capacity && (capacity < 20 || capacity > 60)) {
    errors.push('Capacity must be between 20 and 60');
  }

  // Type validation
  const validTypes = ['express', 'semi-express', 'normal', 'luxury', 'super-luxury'];
  if (type && !validTypes.includes(type)) {
    errors.push(`Type must be one of: ${validTypes.join(', ')}`);
  }

  // ObjectId validation for routeId
  if (routeId && !mongoose.Types.ObjectId.isValid(routeId)) {
    errors.push('Invalid route ID format');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate bus update data
 */
exports.validateBusUpdate = (req, res, next) => {
  const { busNumber, registrationNumber, routeId, capacity, type, status } = req.body;

  const errors = [];

  // Bus number validation
  if (busNumber && typeof busNumber !== 'string') {
    errors.push('Bus number must be a string');
  }

  // Registration number format validation
  if (registrationNumber && !/^[A-Z]{2,3}-[0-9]{4}$/i.test(registrationNumber)) {
    errors.push('Registration number format is invalid (e.g., WP-1234)');
  }

  // Capacity validation
  if (capacity && (capacity < 20 || capacity > 60)) {
    errors.push('Capacity must be between 20 and 60');
  }

  // Type validation
  const validTypes = ['express', 'semi-express', 'normal', 'luxury', 'super-luxury'];
  if (type && !validTypes.includes(type)) {
    errors.push(`Type must be one of: ${validTypes.join(', ')}`);
  }

  // Status validation
  const validStatuses = ['active', 'inactive', 'maintenance', 'en-route', 'at-stop', 'breakdown'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // ObjectId validation for routeId
  if (routeId && !mongoose.Types.ObjectId.isValid(routeId)) {
    errors.push('Invalid route ID format');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate location update data
 */
exports.validateLocation = (req, res, next) => {
  const { longitude, latitude } = req.body;

  const errors = [];

  if (!longitude) errors.push('Longitude is required');
  if (!latitude) errors.push('Latitude is required');

  if (longitude && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
    errors.push('Longitude must be a number between -180 and 180');
  }

  if (latitude && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
    errors.push('Latitude must be a number between -90 and 90');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate driver assignment data
 */
exports.validateDriverAssignment = (req, res, next) => {
  const { userId, name, contactNumber, licenseNumber } = req.body;

  const errors = [];

  // If userId provided, validate ObjectId format
  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    errors.push('Invalid user ID format');
  }

  // Validate contact number format if provided
  if (contactNumber && !/^[0-9]{10}$/.test(contactNumber)) {
    errors.push('Contact number must be 10 digits');
  }

  // Validate license number format if provided
  if (licenseNumber && !/^[A-Z0-9]{8,12}$/i.test(licenseNumber)) {
    errors.push('License number must be 8-12 alphanumeric characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};